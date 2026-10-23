"use client";

import { useCallback, useMemo, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Info, RotateCcw, X } from "lucide-react";
import { useSeatLocks, useSeatMap } from "./hooks";
import { isVipTier, SeatMap } from "./SeatMap";
import { useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { loginHref } from "@/components/shared/RequireAuth";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { SeatLegend } from "@/components/shared/SeatLegend";
import { SeatSummarySheet } from "@/components/shared/SeatSummarySheet";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { errorMessage, isStatus } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { Seat, SeatMapData } from "@/types/event";

export function SeatSelectionView({ sessionId }: { sessionId: number }) {
  const map = useSeatMap(sessionId);
  if (isStatus(map.error, 404)) notFound();
  if (map.isError && !map.data) {
    return (
      <>
        <PageTopBar fallbackHref="/events" />
        <ErrorState className="container-page my-6" message={errorMessage(map.error, "دریافت نقشه سالن با خطا مواجه شد.")} onRetry={() => map.refetch()} />
      </>
    );
  }
  if (!map.data) return <SeatSelectionSkeleton />;
  return <SeatSelection sessionId={sessionId} data={map.data} receivedAt={map.dataUpdatedAt} refetch={() => map.refetch()} />;
}

function SeatSelection({ sessionId, data, receivedAt, refetch }: { sessionId: number; data: SeatMapData; receivedAt: number; refetch: () => void }) {
  const router = useRouter();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const { toggle, releaseAll, pending } = useSeatLocks(sessionId);
  const [cartOpen, setCartOpen] = useState(false);
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
    toast.error("زمان نگهداری صندلی‌ها به پایان رسید و آزاد شدند. لطفاً دوباره انتخاب کنید.");
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

  const place = [session.hall_name ?? session.venue_name, session.city_name].filter(Boolean).join("، ");

  return (
    <>
      <PageTopBar fallbackHref={`/events/${encodeURIComponent(session.event_slug)}`} />
      <div className="container-page space-y-3 pb-[200px] pt-1 lg:pb-10 lg:pt-6">
        {/* Event strip: photo with the title, place, date and time */}
        <section aria-label="اطلاعات سانس" className="relative overflow-hidden rounded-[18px] bg-navy-950 text-white">
          <SmartImage src={mediaUrl(session.banner_url)} fallback={null} alt="" fill preload sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0b2b5b] via-[#0b2b5b]/85 via-50% to-[#0b2b5b]/30" />
          <div className="relative p-4 sm:p-5">
            <h1 className="text-[20px] font-black leading-8 sm:text-[24px]">{session.event_title}</h1>
            {(session.title || session.event_subtitle) && <p className="mt-0.5 text-[13.5px] text-white/85">{session.title ?? session.event_subtitle}</p>}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-white/90">
              {place && (
                <li className="flex items-center gap-1.5">
                  <Icon name="common/location" className="size-4" />
                  {place}
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <Icon name="common/calendar-simple" className="size-4" />
                {faFullDate(session.start_time)}
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="common/clock" className="size-4" />
                <span className="tabular">{faTime(session.start_time)}</span>
              </li>
            </ul>
          </div>
        </section>

        {!onSale && (
          <p role="alert" className="rounded-2xl bg-warning-bg px-4 py-3 text-[14px] font-semibold text-ink">
            فروش این سانس فعال نیست؛ امکان انتخاب صندلی وجود ندارد.
          </p>
        )}

        {/* Reservation countdown from the server's hold deadline */}
        {data.hold?.seconds_left != null && selected.length > 0 ? (
          <section aria-label="زمان رزرو" className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3">
            <p className="min-w-0 flex-1 text-[12.5px] leading-6 text-ink-2">
              صندلی‌های انتخاب‌شده برای شما محفوظ هستند. لطفاً در زمان مقرر خرید را تکمیل کنید.
            </p>
            <div className="shrink-0 text-left">
              <p className="text-[11.5px] text-ink-2">زمان باقی‌مانده برای رزرو</p>
              <div className="flex items-center justify-end gap-2">
                <HoldTimer variant="large" secondsLeft={data.hold.seconds_left} receivedAt={receivedAt} onExpire={onExpire} />
                <Icon name="common/clock" className="size-7 text-brand-600" />
              </div>
            </div>
          </section>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-[12.5px] leading-6 text-ink-2">
            <Info className="size-[18px] shrink-0 text-brand-600" />
            با انتخاب هر صندلی، آن صندلی تا {faNumber(data.hold?.hold_minutes ?? 10)} دقیقه برای شما نگه داشته می‌شود.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <section aria-labelledby="map-title" className="card min-w-0 p-3 sm:p-4">
            <h2 id="map-title" className="sr-only">
              نقشه سالن
            </h2>
            {seats.length === 0 ? (
              <EmptyState className="border-0" message="برای این سانس نقشه صندلی تعریف نشده است." />
            ) : (
              <SeatMap seats={seats} sections={sections} tiers={session.tiers} fallbackPrice={Number(session.price)} pending={pending} onToggle={onSale ? onToggle : () => {}} />
            )}
            <SeatLegend className="mt-3" seats={seats} tiers={session.tiers} fallbackPrice={Number(session.price)} isVip={isVipTier} />
          </section>

          <aside className="lg:sticky lg:top-24">
            <SeatSummarySheet
              count={selected.length}
              description={description}
              total={subtotal + fee}
              onContinue={proceed}
              onExpand={() => setCartOpen(true)}
              continuing={leaving}
              disabled={pending.size > 0}
            >
              {cart}
            </SeatSummarySheet>
          </aside>
        </div>
      </div>

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
      <PageTopBar fallbackHref="/events" />
      <div className="container-page space-y-3 pt-1 lg:pt-6" aria-busy>
        <Skeleton className="h-[120px] rounded-[18px]" />
        <Skeleton className="h-[64px] rounded-2xl" />
        <div className="card flex h-[460px] flex-col items-center justify-center gap-3 text-[14px] text-muted">
          <span className="size-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          در حال بارگذاری نقشه سالن ...
        </div>
      </div>
    </>
  );
}
