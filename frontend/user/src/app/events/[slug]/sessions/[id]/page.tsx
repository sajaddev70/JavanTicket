'use client';

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronLeft, Clock, Expand, Loader2, Map as MapIcon, MapPin, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Armchair, Tag, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SeatMap, type Seat } from "@/components/seatmap/SeatMap";
import { useTheme } from "@/components/ui/ThemeToggle";
import { usePageBlocks, useSeatMap } from "@/hooks/usePublicData";
import { useUserAuthStore } from "@/stores/useUserAuthStore";
import { ordersApi } from "@/services/orders";
import { publicApi } from "@/services/public";
import { faDate, faNumber, faPrice, faTime, faWeekday, toFaDigits } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

const HOLD_SECONDS = 15 * 60;
const MAX_SEATS = 10;
const TAKEN = "#9ca3af";
const PENDING_KEY = "pending_checkout";

export default function SeatSelectionPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />
      <main className="flex-1">
        <SeatSelection slug={decodeURIComponent(slug)} sessionId={Number(id)} />
      </main>
      <SiteFooter />
    </div>
  );
}

function readPending(sessionId: number): number[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null") as { sessionId: number; seatIds: number[] } | null;
    return raw?.sessionId === sessionId ? raw.seatIds : [];
  } catch {
    return [];
  }
}

function SeatSelection({ slug, sessionId }: { slug: string; sessionId: number }) {
  const router = useRouter();
  const dark = useTheme() === "dark";
  const hero = usePageBlocks().data?.SEAT_HERO;
  const map = useSeatMap(sessionId);
  const token = useUserAuthStore((s) => s.token);
  const boxRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(() => (typeof window === "undefined" ? new Set() : new Set(readPending(sessionId))));
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [notice, setNotice] = useState("");
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ code: string; discount: number } | null>(null);

  // Countdown for completing the purchase; when it runs out the selection is released and the clock restarts.
  const deadline = useRef(0);
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    deadline.current = Date.now() + HOLD_SECONDS * 1000;
    const id = setInterval(() => {
      let left = Math.round((deadline.current - Date.now()) / 1000);
      if (left <= 0) {
        if (selectedRef.current.size) {
          setSelected(new Set());
          setDiscount(null);
          setNotice("زمان انتخاب به پایان رسید و صندلی‌ها آزاد شدند. می‌توانید دوباره انتخاب کنید.");
        }
        deadline.current = Date.now() + HOLD_SECONDS * 1000;
        left = HOLD_SECONDS;
      }
      setSecondsLeft(left);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const data = map.data;
  const tiers = useMemo(() => new Map((data?.session.tiers ?? []).map((t) => [t.code, t])), [data]);
  const seats = useMemo(() => data?.seats ?? [], [data]);
  const seatById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);
  // On narrow screens the map scrolls sideways: start centred on the stage instead of at one edge.
  const hasSeats = seats.length > 0;
  useEffect(() => {
    const box = boxRef.current;
    if (hasSeats && box && box.scrollWidth > box.clientWidth) box.scrollLeft = -(box.scrollWidth - box.clientWidth) / 2;
  }, [hasSeats]);
  // Seats bought by someone else since they were picked drop out of the selection.
  const chosen = [...selected].map((id) => seatById.get(id)).filter((s): s is NonNullable<typeof s> => !!s && s.status === "AVAILABLE");
  const priceOf = (s: { tier_code?: string | null }) => Number(tiers.get(s.tier_code ?? "")?.price ?? data?.session.price ?? 0);
  const subtotal = chosen.reduce((sum, s) => sum + priceOf(s), 0);
  const total = Math.max(0, subtotal - (discount?.discount ?? 0));

  const applyCode = useMutation({
    mutationFn: () => publicApi.validateDiscount(code.trim(), subtotal),
    onSuccess: (d) => setDiscount({ code: d.code, discount: Number(d.discount) }),
  });
  const checkout = useMutation({
    mutationFn: () => ordersApi.checkout({ session_id: sessionId, seat_ids: chosen.map((s) => s.id), discount_code: discount?.code ?? null }),
    onSuccess: (d) => {
      sessionStorage.removeItem(PENDING_KEY);
      router.push(`/orders/${d.order_number}`);
    },
    onError: () => map.refetch(),
  });

  if ((map.error as { status?: number } | null)?.status === 404) notFound();

  function toggle(seat: Seat) {
    setNotice("");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else if (next.size >= MAX_SEATS) setNotice(`حداکثر ${toFaDigits(String(MAX_SEATS))} صندلی در هر خرید قابل انتخاب است.`);
      else next.add(seat.id);
      return next;
    });
    if (discount) setDiscount(null);
  }

  function proceed() {
    if (!token) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ sessionId, seatIds: chosen.map((s) => s.id) }));
      router.push(`/login?next=${encodeURIComponent(`/events/${slug}/sessions/${sessionId}`)}`);
      return;
    }
    checkout.mutate();
  }

  const s = data?.session;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 opacity-35">
          <SmartImage src={mediaUrl(hero?.image_url)} fallback={null} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-[#06142e] via-[#06142e]/85 to-[#06142e]/60" />
        <div className="relative mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-7 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <nav aria-label="مسیر صفحه" className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/75">
              <Link href="/" className="hover:text-white">
                خانه
              </Link>
              <span>/</span>
              <Link href="/events" className="hover:text-white">
                رویدادها
              </Link>
              <span>/</span>
              <Link href={`/events/${encodeURIComponent(slug)}`} className="hover:text-white">
                {s?.event_title ?? "…"}
              </Link>
              <span>/</span>
              <span className="text-white">{hero?.title ?? ""}</span>
            </nav>
            {hero?.title && <h1 className="mt-3 text-[28px] font-black sm:text-[36px]">{hero.title}</h1>}
            {hero?.subtitle && <p className="mt-1.5 text-[14.5px] text-white/85">{hero.subtitle}</p>}
          </div>
          {s && (
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur lg:w-[500px]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-extrabold">{s.title || s.event_title}</p>
                <p className="mt-2 flex items-center gap-2 text-[13px] text-white/85">
                  <CalendarDays className="size-4 shrink-0" />
                  {faWeekday(s.start_time)} {faDate(s.start_time)} • ساعت {faTime(s.start_time)}
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-white/85">
                  <MapPin className="size-4 shrink-0" />
                  {s.hall_name} {s.venue_name ? `${s.venue_name} - ` : "- "}
                  {s.city_name}
                </p>
              </div>
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-white/10">
                <SmartImage src={mediaUrl(s.banner_url)} fallback={null} alt="" fill sizes="96px" className="object-cover" />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto mt-5 grid max-w-[1440px] grid-cols-1 gap-5 px-3 sm:px-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-10">
        <section className="min-w-0 rounded-[20px] border border-line bg-surface p-3 shadow-card sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[18px] font-black text-ink">
                <MapIcon className="size-5 text-brand-600" />
                نقشه سالن
              </h2>
              <p className="mt-1 text-[12.5px] text-muted">برای انتخاب صندلی، روی صندلی مورد نظر کلیک کنید.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => boxRef.current?.requestFullscreen?.()} className="flex size-10 items-center justify-center rounded-xl border border-line" aria-label="تمام صفحه">
                <Expand className="size-4" />
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} className="flex size-10 items-center justify-center rounded-xl border border-line" aria-label="کوچک‌نمایی">
                <Minus className="size-4" />
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.15))} className="flex size-10 items-center justify-center rounded-xl border border-line" aria-label="بزرگ‌نمایی">
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(new Set());
                  setDiscount(null);
                }}
                className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-[13px] font-bold text-ink"
              >
                بازنشانی انتخاب
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          <div ref={boxRef} className="mt-4 overflow-auto rounded-2xl bg-surface p-2" style={{ maxHeight: "75vh" }}>
            {map.isError ? (
              <ErrorState message="دریافت نقشه سالن با خطا مواجه شد." onRetry={() => map.refetch()} />
            ) : map.isLoading ? (
              <Skeleton className="h-[480px] rounded-xl" />
            ) : seats.length === 0 ? (
              <EmptyState message="برای این سانس نقشه صندلی تعریف نشده است." />
            ) : (
              <SeatMap
                seats={seats}
                colorOf={(seat) => (seat.status === "AVAILABLE" ? tiers.get(seat.tier_code ?? "")?.color ?? "#93c5fd" : seat.status === "DISABLED" ? (dark ? "#334155" : "#e2e8f0") : TAKEN)}
                selected={new Set(chosen.map((c) => c.id))}
                onSeat={toggle}
                isSelectable={(seat) => seat.status === "AVAILABLE"}
                zoom={zoom}
                dark={dark}
              />
            )}
          </div>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-line px-4 py-3 text-[13px] text-ink">
            {(s?.tiers ?? []).map((t) => (
              <li key={t.code} className="flex items-center gap-2">
                <span className="size-4 rounded-full" style={{ background: t.color }} />
                {t.name} - {faPrice(t.price ?? s?.price)}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="size-4 rounded-full" style={{ background: TAKEN }} />
              رزرو شده
            </li>
          </ul>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[20px] border border-line bg-surface p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-[18px] font-black text-ink">
              <ShoppingCart className="size-5 text-brand-600" />
              خلاصه سفارش
            </h2>
            {s && (
              <div className="mt-3 rounded-xl bg-surface-2 p-3.5">
                <p className="font-extrabold text-ink">{s.title || s.event_title}</p>
                <p className="mt-2 flex items-center gap-2 text-[12.5px] text-muted">
                  <CalendarDays className="size-4" />
                  {faWeekday(s.start_time)} {faDate(s.start_time)} • ساعت {faTime(s.start_time)}
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-muted">
                  <MapPin className="size-4" />
                  {s.hall_name} - {s.city_name}
                </p>
              </div>
            )}

            <h3 className="mt-5 flex items-center gap-2 text-[15px] font-extrabold text-ink">
              <Armchair className="size-5 text-brand-600" />
              صندلی‌های انتخاب‌شده
            </h3>
            {chosen.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-muted">هنوز صندلی‌ای انتخاب نکرده‌اید.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {chosen.map((seat) => {
                  const tier = tiers.get(seat.tier_code ?? "");
                  return (
                    <li key={seat.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                      <span className="size-3.5 shrink-0 rounded-full" style={{ background: tier?.color ?? "#93c5fd" }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-ink">
                          بخش {tier?.name ?? "—"} <span className="text-line-strong">|</span> ردیف {seat.row_label} <span className="text-line-strong">|</span> شماره {faNumber(seat.seat_number)}
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold text-success-fg">{faPrice(priceOf(seat))}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggle(seat)}
                        className="flex size-8 items-center justify-center rounded-lg border border-line text-muted hover:text-danger-fg"
                        aria-label="حذف صندلی"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-muted">تعداد صندلی‌ها</dt>
                <dd className="font-bold text-ink">{faNumber(chosen.length)} عدد</dd>
              </div>
              {discount && (
                <div className="flex justify-between text-success-fg">
                  <dt>تخفیف ({discount.code})</dt>
                  <dd className="font-bold">- {faPrice(discount.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">مبلغ کل</dt>
                <dd className="text-[17px] font-black text-ink">{faPrice(total)}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-success/30 bg-success/5">
              <button type="button" onClick={() => setCodeOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-bold text-ink" aria-expanded={codeOpen}>
                <span className="flex items-center gap-2">
                  <Tag className="size-5 text-success-fg" />
                  کد تخفیف دارید؟
                </span>
                <ChevronDown className={cn("size-5 text-muted transition", codeOpen && "rotate-180")} />
              </button>
              {codeOpen && (
                <div className="px-3 pb-3">
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        applyCode.reset();
                      }}
                      dir="ltr"
                      placeholder="JAVAN20"
                      aria-label="کد تخفیف"
                      className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-left text-[14px] uppercase text-ink outline-none focus:border-brand-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => applyCode.mutate()}
                      disabled={!code.trim() || !subtotal || applyCode.isPending}
                      className="h-11 shrink-0 rounded-xl bg-success px-4 text-[13.5px] font-bold text-white disabled:opacity-50"
                    >
                      اعمال
                    </button>
                  </div>
                  {applyCode.isError && <p className="mt-2 text-[12.5px] text-danger-fg">{(applyCode.error as { message?: string })?.message}</p>}
                  {!subtotal && <p className="mt-2 text-[12px] text-muted">ابتدا صندلی انتخاب کنید.</p>}
                </div>
              )}
            </div>

            {(notice || checkout.isError) && (
              <p className="mt-3 rounded-xl bg-danger/8 px-3 py-2 text-[13px] text-danger-fg" role="alert">
                {notice || (checkout.error as { message?: string })?.message}
              </p>
            )}

            <button
              type="button"
              onClick={proceed}
              disabled={!chosen.length || checkout.isPending}
              className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-[16px] font-bold text-white shadow-cta hover:bg-brand-700 disabled:opacity-60"
            >
              {checkout.isPending && <Loader2 className="size-5 animate-spin" />}
              ادامه و پرداخت
              <ChevronLeft className="size-5" />
            </button>

            <div className="mt-3 flex items-start gap-3 rounded-xl bg-surface-2 p-3">
              <ShieldCheck className="mt-0.5 size-6 shrink-0 text-brand-600" />
              <div>
                <p className="text-[13px] font-bold text-ink">پرداخت از طریق درگاه امن بانکی</p>
                <p className="mt-0.5 text-[11.5px] text-muted">اطلاعات شما با بالاترین استانداردهای امنیتی محافظت می‌شود.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3.5">
            <span className="text-[14px] font-bold text-ink">زمان باقیمانده برای تکمیل خرید</span>
            <span className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-1.5 text-[18px] font-black text-danger-fg">
              <Clock className="size-5" />
              <span className="tabular" dir="ltr">
                {toFaDigits(`${minutes}:${seconds}`)}
              </span>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
