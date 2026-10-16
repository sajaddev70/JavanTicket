"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Clock, Info, MapPin, RotateCcw, ShieldCheck, ShoppingCart, X } from "lucide-react";
import { useSeatLocks, useSeatMap } from "./hooks";
import { SeatLegend, SeatMap } from "./SeatMap";
import { usePageBlock, useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { loginHref } from "@/components/shared/RequireAuth";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { errorMessage, isStatus } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { Seat, SeatMapData } from "@/types/event";

export function SeatSelectionView({ sessionId }: { sessionId: number }) {
  const map = useSeatMap(sessionId);
  if (isStatus(map.error, 404)) notFound();
  if (map.isError && !map.data) return <ErrorState className="container-page my-6" message={errorMessage(map.error, "دریافت نقشه سالن با خطا مواجه شد.")} onRetry={() => map.refetch()} />;
  if (!map.data) return <SeatSelectionSkeleton />;
  return <SeatSelection sessionId={sessionId} data={map.data} receivedAt={map.dataUpdatedAt} refetch={() => map.refetch()} />;
}

function SeatSelection({ sessionId, data, receivedAt, refetch }: { sessionId: number; data: SeatMapData; receivedAt: number; refetch: () => void }) {
  const router = useRouter();
  const { block } = usePageBlock("SEAT_HERO");
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const { toggle, releaseAll, pending } = useSeatLocks(sessionId);
  const [cartOpen, setCartOpen] = useState(false);
  const { session, seats, sections } = data;

  const tierByCode = useMemo(() => new Map(session.tiers.map((t) => [t.code, t])), [session.tiers]);
  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const selected = useMemo(() => seats.filter((s) => s.status === "SELECTED"), [seats]);
  const priceOf = useCallback((s: Seat) => Number(tierByCode.get(s.tier_code ?? "")?.price ?? session.price), [tierByCode, session.price]);
  const subtotal = selected.reduce((sum, s) => sum + priceOf(s), 0);
  // Preview only: the order's fee is calculated by the backend at checkout.
  const feePercent = Number(useSiteSettings().data?.service_fee_percent ?? 0);
  const fee = Math.round((subtotal * feePercent) / 100);
  const prices = session.tiers.map((t) => Number(t.price ?? session.price)).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : Number(session.price);
  const maxPrice = prices.length ? Math.max(...prices) : Number(session.price);
  const maxSeats = data.hold?.max_seats ?? 10;
  const onSale = session.status === "ACTIVE" && new Date(session.start_time).getTime() > receivedAt;

  const onToggle = useCallback(
    (seat: Seat) => {
      if (seat.status !== "SELECTED" && selected.length >= maxSeats) {
        toast.error(`در هر خرید حداکثر ${faNumber(maxSeats)} صندلی قابل انتخاب است.`);
        return;
      }
      toggle(seat);
    },
    [selected.length, maxSeats, toggle],
  );

  const onExpire = useCallback(() => {
    toast.error("زمان نگهداری صندلی‌ها به پایان رسید و آزاد شدند. لطفاً دوباره انتخاب کنید.");
    refetch();
  }, [refetch]);

  function proceed() {
    const target = `/checkout?session=${sessionId}`;
    router.push(authenticated ? target : loginHref(target));
  }

  const seatTitle = (s: Seat) => {
    const section = sectionById.get(s.section_id)?.name;
    return `${section ? `سکشن ${section} - ` : ""}ردیف ${s.row_label} - صندلی ${faNumber(s.seat_number)}`;
  };

  const cart = (
    <>
      {selected.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong p-5 text-center text-[13px] leading-7 text-muted">برای انتخاب، روی صندلی‌های آزاد در نقشه سالن بزنید.</p>
      ) : (
        <ul className="space-y-2">
          {selected.map((s) => {
            const tier = tierByCode.get(s.tier_code ?? "");
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="size-3 shrink-0 rounded-full bg-brand-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink">{seatTitle(s)}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-2">
                    {tier?.name && <span className="text-muted">{tier.name} • </span>}
                    {faPrice(priceOf(s))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  disabled={pending.has(s.id)}
                  aria-label={`حذف ${seatTitle(s)}`}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:border-danger/40 hover:text-danger-fg disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <dl className="mt-4 space-y-3 border-t border-line pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-ink-2">جمع مبلغ بلیت‌ها</dt>
          <dd className="font-bold text-ink">{faPrice(subtotal)}</dd>
        </div>
        {fee > 0 && (
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5 text-ink-2">
              هزینه خدمات سامانه
              <span title={`${faNumber(feePercent)} درصد مبلغ بلیت‌ها`} className="inline-flex text-muted">
                <Info className="size-4" aria-hidden />
                <span className="sr-only">{`${faNumber(feePercent)} درصد مبلغ بلیت‌ها`}</span>
              </span>
            </dt>
            <dd className="font-bold text-ink">{faPrice(fee)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <dt className="font-black text-ink">جمع قابل پرداخت</dt>
          <dd className="text-[19px] font-black text-ink">{faPrice(subtotal + fee)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[12px] leading-6 text-muted">مبلغ نهایی و کد تخفیف در مرحله بعد توسط سامانه محاسبه می‌شود.</p>
    </>
  );

  return (
    <div className="container-page space-y-4 pb-28 pt-4 lg:pb-10">
      <div>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "رویدادها", href: "/events" },
            { label: session.event_title, href: `/events/${encodeURIComponent(session.event_slug)}` },
            { label: block?.title ?? "انتخاب صندلی" },
          ]}
        />
        <h1 className="mt-2 text-[24px] font-black text-ink sm:text-[28px]">{block?.title ?? "انتخاب صندلی"}</h1>
        {block?.subtitle && <p className="mt-1 text-[14px] text-ink-2">{block.subtitle}</p>}
      </div>

      <section aria-label="اطلاعات سانس" className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
        <div className="relative hidden shrink-0 overflow-hidden rounded-xl bg-field sm:block sm:aspect-[312/132] sm:w-[312px]">
          <SmartImage src={mediaUrl(session.banner_url)} fallback={null} alt={session.event_title} fill preload sizes="(min-width: 640px) 312px, 100vw" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1 sm:px-2">
          <h2 className="text-[19px] font-black text-ink">
            <Link href={`/events/${encodeURIComponent(session.event_slug)}`} className="hover:text-brand-600">
              {session.event_title}
            </Link>
          </h2>
          {session.title && <p className="mt-1 text-[13px] text-ink-2">{session.title}</p>}
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-2">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-[18px] text-ink" />
              {[session.hall_name, session.venue_name].filter(Boolean).join(" ")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-[18px] text-ink" />
              {session.city_name}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-line text-[13.5px] sm:w-[440px] sm:border-r sm:pr-5">
          <div className="space-y-2.5">
            <p className="flex items-center gap-2 text-ink">
              <CalendarDays className="size-[18px] text-ink-2" />
              {faFullDate(session.start_time)}
            </p>
            <p className="flex items-center gap-2 text-ink">
              <Clock className="size-[18px] text-ink-2" />
              ساعت {faTime(session.start_time)}
            </p>
          </div>
          <div className="border-r border-line pr-4">
            <p className="text-[12.5px] text-muted">محدوده قیمت بلیت</p>
            <p className="mt-1 font-black text-ink">{minPrice === maxPrice ? faPrice(minPrice) : `${faNumber(minPrice)} تا ${faPrice(maxPrice)}`}</p>
          </div>
        </div>
      </section>

      {!onSale && (
        <p role="alert" className="rounded-2xl bg-warning-bg px-4 py-3 text-[14px] font-semibold text-ink">
          فروش این سانس فعال نیست؛ امکان انتخاب صندلی وجود ندارد.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start">
        <aside aria-labelledby="cart-title" className="card order-2 hidden p-4 lg:sticky lg:top-24 lg:order-1 lg:block">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-3">
            <h2 id="cart-title" className="flex items-center gap-2 text-[18px] font-black text-ink">
              <ShoppingCart className="size-6 text-brand-600" />
              سبد خرید بلیت
            </h2>
            <HoldTimer secondsLeft={data.hold?.seconds_left} receivedAt={receivedAt} onExpire={onExpire} />
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-bold text-ink">بلیت‌های انتخاب‌شده</span>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[13px] font-black text-brand-600">{faNumber(selected.length)}</span>
          </div>
          {cart}
          <Button size="xl" block className="mt-4" disabled={!selected.length || pending.size > 0} onClick={proceed}>
            ادامه و تکمیل سفارش
            <ArrowLeft className="size-5" />
          </Button>
          {selected.length > 0 && (
            <button type="button" onClick={releaseAll} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 text-[13.5px] font-bold text-ink-2 hover:text-danger-fg">
              <RotateCcw className="size-4" />
              لغو انتخاب همه صندلی‌ها
            </button>
          )}
          <p className="mt-2 flex items-center justify-center gap-2 text-[12.5px] text-muted">
            <ShieldCheck className="size-4 text-brand-600" />
            پرداخت امن در درگاه رسمی بانکی
          </p>
        </aside>

        <section aria-labelledby="map-title" className="card order-1 min-w-0 p-3 sm:p-4 lg:order-2">
          <h2 id="map-title" className="sr-only">
            نقشه سالن
          </h2>
          {seats.length === 0 ? (
            <EmptyState message="برای این سانس نقشه صندلی تعریف نشده است." />
          ) : (
            <SeatMap seats={seats} sections={sections} tiers={session.tiers} fallbackPrice={Number(session.price)} pending={pending} onToggle={onSale ? onToggle : () => {}} />
          )}
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-line px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
            <p className="flex items-center gap-2 text-[12.5px] text-muted">
              <Info className="size-4 shrink-0 text-brand-600" />
              برای انتخاب یا لغو انتخاب صندلی، روی صندلی‌ها بزنید. با دو انگشت یا چرخ ماوس بزرگ‌نمایی کنید.
            </p>
            <SeatLegend tiers={session.tiers} fallbackPrice={Number(session.price)} />
          </div>
        </section>
      </div>

      {/* Phones and tablets: selection summary and the next step stay on screen */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 pb-safe backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setCartOpen(true)} className="min-w-0 flex-1 text-right" aria-haspopup="dialog">
            <span className="flex items-center gap-2 text-[12.5px] text-muted">
              {faNumber(selected.length)} صندلی
              <HoldTimer secondsLeft={data.hold?.seconds_left} receivedAt={receivedAt} className="px-1.5 py-0 text-[12px]" />
            </span>
            <span className="block text-[16px] font-black text-ink">{faPrice(subtotal + fee)}</span>
            <span className="text-[12px] font-bold text-brand-600">مشاهده سبد خرید</span>
          </button>
          <Button size="lg" disabled={!selected.length || pending.size > 0} onClick={proceed}>
            ادامه خرید
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      </div>

      <Dialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="سبد خرید بلیت"
        footer={
          <Button block size="lg" disabled={!selected.length} onClick={proceed}>
            ادامه و تکمیل سفارش
          </Button>
        }
      >
        {cart}
        {selected.length > 0 && (
          <button type="button" onClick={releaseAll} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 text-[13.5px] font-bold text-ink-2">
            <RotateCcw className="size-4" />
            لغو انتخاب همه صندلی‌ها
          </button>
        )}
      </Dialog>
    </div>
  );
}

function SeatSelectionSkeleton() {
  return (
    <div className="container-page space-y-4 pt-4" aria-busy>
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[150px] rounded-[18px]" />
      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        <Skeleton className="hidden h-[460px] rounded-[18px] lg:block" />
        <div className="card flex h-[520px] flex-col items-center justify-center gap-3 text-[14px] text-muted">
          <span className="size-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          در حال بارگذاری نقشه سالن ...
        </div>
      </div>
    </div>
  );
}
