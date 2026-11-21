import { Info } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Icon } from "@/components/ui/Icon";
import { faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { Order } from "@/types/order";

/** Seats of an order grouped by tier: [{ name, seats, total }]. */
export function seatGroups(order: Order) {
  const groups = new Map<string, { name: string; seats: Order["seats"]; total: number }>();
  for (const s of order.seats) {
    const key = s.tier_code ?? "-";
    const g = groups.get(key) ?? { name: s.tier_name ?? "عادی", seats: [], total: 0 };
    g.seats.push(s);
    g.total += Number(s.price);
    groups.set(key, g);
  }
  return [...groups.values()];
}

export function seatText(s: Order["seats"][number]) {
  return `${s.section_name ? `${s.section_name} - ` : ""}ردیف ${s.row_label} - صندلی ${faNumber(s.seat_number)}`;
}

/** Event of an order: poster, title, date, time and place. */
export function OrderEventSummary({ order, className, imageClassName }: { order: Order; className?: string; imageClassName?: string }) {
  return (
    <div className={cn("flex gap-3.5", className)}>
      <div className={cn("relative aspect-[4/3] w-[130px] shrink-0 overflow-hidden rounded-2xl bg-navy-900 sm:w-[160px]", imageClassName)}>
        <SmartImage src={mediaUrl(order.banner_url)} fallback={null} alt={order.event_title} fill sizes="160px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-2 py-0.5 text-[12.5px] text-ink-2">
        {order.category_name && <span className="inline-flex rounded-lg bg-brand-50 px-2.5 py-1 text-[12px] font-bold text-brand-600">{order.category_name}</span>}
        <p className="text-[16px] font-black leading-7 text-ink">{order.event_title}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Icon name="common/calendar-simple" className="size-4 shrink-0" />
            {faFullDate(order.start_time)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="common/clock" className="size-4 shrink-0" />
            <span className="tabular">{faTime(order.start_time)}</span>
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <Icon name="common/location" className="mt-0.5 size-4 shrink-0" />
          {[order.city_name, order.hall_name, order.venue_name].filter(Boolean).join("، ")}
        </p>
      </div>
    </div>
  );
}

/**
 * "خلاصه سفارش": every amount exactly as the backend calculated it (subtotal, service fee, discount, total).
 * The frontend never derives a payable amount itself.
 */
export function CheckoutSummary({ order, title = "خلاصه سفارش", header, showUnitPrice, className, children }: { order: Order; title?: string; header?: React.ReactNode; showUnitPrice?: boolean; className?: string; children?: React.ReactNode }) {
  const count = order.quantity ?? order.seats.length;
  const discount = Number(order.discount_amount ?? 0);
  const fee = Number(order.service_fee ?? 0);
  const unit = order.quantity ? Number(order.unit_price) : null;

  return (
    <section aria-labelledby="summary-title" className={cn("card p-4 sm:p-5", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="summary-title" className="text-[18px] font-black text-ink">
          {title}
        </h2>
        {header}
      </div>
      {children}
      <dl className="space-y-3 text-[14px]">
        {showUnitPrice && (
          <>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">تعداد بلیت</dt>
              <dd className="font-bold text-ink">{faNumber(count)} عدد</dd>
            </div>
            {unit !== null && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-2">قیمت هر بلیت</dt>
                <dd className="font-bold text-ink">{faPrice(unit)}</dd>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-ink-2">{showUnitPrice ? "جمع مبلغ بلیت‌ها" : `مبلغ بلیت‌ها (${faNumber(count)} عدد)`}</dt>
          <dd className="font-bold text-ink">{faPrice(order.subtotal)}</dd>
        </div>
        {fee > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-ink-2">
              کارمزد خدمات
              <Info className="size-4 text-muted" aria-hidden />
            </dt>
            <dd className="font-bold text-ink">{faPrice(fee)}</dd>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-success-fg">
            <dt>
              تخفیف{" "}
              {order.discount_code && (
                <span dir="ltr" className="font-code text-[12.5px]">
                  ({order.discount_code})
                </span>
              )}
            </dt>
            <dd className="font-bold" dir="ltr">
              -{faNumber(discount)} <span dir="rtl">تومان</span>
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50 px-4 py-3.5">
          <dt className="text-[15px] font-black text-ink">مبلغ قابل پرداخت</dt>
          <dd className="text-[21px] font-black text-brand-600">{faPrice(order.total_amount)}</dd>
        </div>
      </dl>
    </section>
  );
}
