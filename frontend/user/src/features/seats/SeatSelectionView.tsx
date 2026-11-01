"use client";

import { useCallback, useMemo, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, X } from "lucide-react";
import { useSeatLocks, useSeatMap } from "./hooks";
import { isVipTier, SeatMap } from "./SeatMap";
import { useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { loginHref } from "@/components/shared/RequireAuth";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { SeatLegend } from "@/components/shared/SeatLegend";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { LoadingOverlay, StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage, isStatus } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import type { Seat, SeatMapData } from "@/types/event";

/** 08 انتخاب صندلی: عادی، صندلی انتخاب‌شده، صندلی رزروشده، اتمام زمان رزرو. */
export function SeatSelectionView({ sessionId }: { sessionId: number }) {
  const map = useSeatMap(sessionId);
  if (isStatus(map.error, 404)) notFound();
  if (map.isError && !map.data) {
    return (
      <>
        <PageTopBar title="انتخاب صندلی" fallbackHref="/events" />
        <ErrorState className="container-page" message={errorMessage(map.error, "دریافت نقشه سالن با خطا مواجه شد.")} onRetry={() => map.refetch()} />
      </>
    );
  }
  if (!map.data) return <SeatSelectionSkeleton />;
  return <SeatSelection sessionId={sessionId} data={map.data} receivedAt={map.dataUpdatedAt} refetch={() => map.refetch()} />;
}

function SeatSelection({ sessionId, data, receivedAt, refetch }: { sessionId: number; data: SeatMapData; receivedAt: number; refetch: () => void }) {
  const router = useRouter();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const { toggle, releaseAll, pending, taken, dismissTaken } = useSeatLocks(sessionId);
  const [cartOpen, setCartOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { session, seats, sections } = data;

  const tierByCode = useMemo(() => new Map(session.tiers.map((t) => [t.code, t])), [session.tiers]);
  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const selected = useMemo(() => seats.filter((s) => s.status === "SELECTED"), [seats]);
  const priceOf = useCallback((s: Seat) => Number(tierByCode.get(s.tier_code ?? "")?.price ?? session.price), [tierByCode, session.price]);
  const subtotal = selected.reduce((sum, s) => sum + priceOf(s), 0);
  // Preview only: the order's fee and final amount are calculated by the backend at checkout.
  const feePercent = Number(useSiteSettings().data?.service_fee_percent ?? 0);
  const fee = Math.round((subtotal * feePercent) / 100);
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

  // The hold deadline is the server's (seconds_left); when it passes, the seats are released there: reload the map.
  const onExpire = useCallback(() => {
    setExpired(true);
    refetch();
  }, [refetch]);

  function proceed() {
    setLeaving(true);
    const target = `/checkout?session=${sessionId}`;
    router.push(authenticated ? target : loginHref(target));
  }

  const seatTitle = (s: Seat) => {
    const section = sectionById.get(s.section_id)?.name;
    return `${section ? `${section} - ` : ""}ردیف ${s.row_label} - صندلی ${faNumber(s.seat_number)}`;
  };

  /** "بخش میانی - ردیف E - صندلی‌های ۱۴ و ۱۵" per section and row. */
  const description = useMemo(() => {
    const groups = new Map<string, { section?: string; row: string; numbers: number[] }>();
    for (const s of selected) {
      const key = `${s.section_id}-${s.row_label}`;
      const g = groups.get(key) ?? { section: sectionById.get(s.section_id)?.name, row: s.row_label, numbers: [] };
      g.numbers.push(s.seat_number);
      groups.set(key, g);
    }
    return [...groups.values()]
      .map((g) => {
        const nums = g.numbers.sort((a, b) => a - b).map((n) => faNumber(n));
        const list = nums.length > 1 ? `صندلی‌های ${nums.slice(0, -1).join("، ")} و ${nums[nums.length - 1]}` : `صندلی ${nums[0]}`;
        return [g.section, `ردیف ${g.row}`, list].filter(Boolean).join(" - ");
      })
      .join("؛ ");
  }, [selected, sectionById]);

  const cart = (
    <>
      {selected.length === 0 ? (
        <p className="rounded-xl bg-surface-2 p-5 text-center text-[13px] leading-7 text-muted">برای انتخاب، روی صندلی‌های آزاد در نقشه سالن بزنید.</p>
      ) : (
        <ul className="space-y-2">
          {selected.map((s) => {
            const tier = tierByCode.get(s.tier_code ?? "");
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
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
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-danger-bg hover:text-danger-fg disabled:opacity-50"
                >
                  <X className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <dl className="mt-3 space-y-2.5 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-ink-2">جمع مبلغ بلیت‌ها</dt>
          <dd className="font-bold text-ink">{faPrice(subtotal)}</dd>
        </div>
        {fee > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-2">هزینه خدمات (تقریبی)</dt>
            <dd className="font-bold text-ink">{faPrice(fee)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-[12px] leading-6 text-muted">مبلغ نهایی و کد تخفیف در مرحله بعد توسط سامانه محاسبه می‌شود.</p>
      {selected.length > 0 && (
        <button type="button" onClick={releaseAll} className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 text-[13.5px] font-bold text-ink-2 hover:text-danger-fg">
          <RotateCcw className="size-4" />
          لغو انتخاب همه صندلی‌ها
        </button>
      )}
    </>
  );

  const short = selected.map((x) => `${x.row_label}${faNumber(x.seat_number)}`).join(" ، ");

  return (
    <>
      <PageTopBar title="انتخاب صندلی" subtitle={session.event_title} fallbackHref={`/events/${encodeURIComponent(session.event_slug)}`} />
      <div className="container-page pb-32 pt-1.5 lg:pb-10">
        {!onSale && (
          <p role="alert" className="mb-3 rounded-[15px] bg-warning-bg px-4 py-3 text-[13px] font-semibold text-ink">
            فروش این سانس فعال نیست؛ امکان انتخاب صندلی وجود ندارد.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <section aria-labelledby="map-title" className="min-w-0">
            <div className="mb-[9px] flex items-center justify-between gap-3">
              <h2 id="map-title" className="text-[15px] font-black text-ink">
                نمای سالن
              </h2>
              <span className="text-[11px] text-muted">{faFullDate(session.start_time)} · {faTime(session.start_time)}</span>
            </div>
            {seats.length === 0 ? (
              <EmptyState symbol={SYMBOL.ticket} message="برای این سانس نقشه صندلی تعریف نشده است." />
            ) : (
              <SeatMap seats={seats} sections={sections} tiers={session.tiers} fallbackPrice={Number(session.price)} pending={pending} onToggle={onSale ? onToggle : () => {}} />
            )}
          </section>

          <aside className="card p-4 lg:sticky lg:top-24">
            <SeatLegend seats={seats} tiers={session.tiers} fallbackPrice={Number(session.price)} isVip={isVipTier} />
            <p className="mt-3 text-[13px] text-ink">{selected.length ? `صندلی‌های انتخابی: ${short}` : "برای انتخاب، روی صندلی‌های آزاد نقشه بزنید."}</p>
            {selected.length > 0 && <p className="sr-only">{description}</p>}
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <b className="text-[14px] font-black text-ink">مجموع: {faPrice(subtotal + fee)}</b>
              {data.hold?.seconds_left != null && selected.length > 0 && <HoldTimer secondsLeft={data.hold.seconds_left} receivedAt={receivedAt} onExpire={onExpire} />}
            </div>
            {selected.length > 0 && (
              <button type="button" onClick={() => setCartOpen(true)} aria-haspopup="dialog" className="mt-1 min-h-10 text-[12px] font-bold text-brand-500">
                مشاهده سبد خرید
              </button>
            )}
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-page via-page/80 to-transparent lg:bg-none px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-6 lg:static lg:mt-4 lg:ml-auto lg:max-w-[380px] lg:p-0">
          <Button size="xl" block onClick={proceed} disabled={pending.size > 0 || !selected.length} loading={leaving}>
            ادامه خرید
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      </div>

      {taken && <StateDialog symbol={SYMBOL.warning} title="صندلی دیگر در دسترس نیست" message="این صندلی توسط کاربر دیگری رزرو شده است." actionLabel="تلاش مجدد" onAction={dismissTaken} />}
      {expired && <StateDialog symbol={SYMBOL.wait} title="زمان رزرو به پایان رسید" message="صندلی‌ها آزاد شدند؛ انتخاب را از نو آغاز کنید." onAction={() => setExpired(false)} />}

      <Dialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="صندلی‌های انتخاب‌شده"
        footer={
          <Button block size="lg" disabled={!selected.length || pending.size > 0} onClick={proceed}>
            ادامه خرید
          </Button>
        }
      >
        {cart}
      </Dialog>
    </>
  );
}

function SeatSelectionSkeleton() {
  return (
    <>
      <PageTopBar title="انتخاب صندلی" fallbackHref="/events" />
      <LoadingOverlay title="در حال بارگذاری" message="نقشه سالن آماده می‌شود." />
    </>
  );
}
