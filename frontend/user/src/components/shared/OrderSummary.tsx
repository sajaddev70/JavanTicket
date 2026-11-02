import { EventSummaryCard } from "@/components/shared/EventCard";
import { faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Order } from "@/types/order";

export function seatText(s: Order["seats"][number]) {
  return `${s.section_name ? `${s.section_name} - ` : ""}ردیف ${s.row_label} - صندلی ${faNumber(s.seat_number)}`;
}

/** Seats as short labels: A8، A9; or the ticket count of a general-admission order. */
export function shortSeats(order: Order): string {
  return order.quantity ? `${faNumber(order.quantity)} بلیت ورود عمومی` : order.seats.map((s) => `${s.row_label}${faNumber(s.seat_number)}`).join("، ");
}

/** The order's event as the design's light card, with the amount the backend calculated. */
export function OrderEventCard({ order, className }: { order: Order; className?: string }) {
  return (
    <EventSummaryCard
      banner={order.banner_url}
      title={order.event_title}
      date={`${faFullDate(order.start_time)} · ساعت ${faTime(order.start_time)}`}
      place={[order.city_name, order.hall_name].filter(Boolean).join("، ")}
      className={className}
    >
      {shortSeats(order) && <p className="truncate text-[11px] text-muted">{shortSeats(order)}</p>}
      <p className="text-[13px] font-black text-brand-600">{faPrice(order.total_amount)}</p>
    </EventSummaryCard>
  );
}

/**
 * Glass panel of an order's amounts, exactly as the backend calculated them (subtotal, service fee, discount, total).
 * The frontend never derives a payable amount itself.
 */
export function OrderAmounts({ order, children, className }: { order: Order; children?: React.ReactNode; className?: string }) {
  const count = order.quantity ?? order.seats.length;
  const discount = Number(order.discount_amount ?? 0);
  const fee = Number(order.service_fee ?? 0);
  return (
    <section aria-label="مبالغ سفارش" className={cn("card p-4", className)}>
      <dl className="space-y-3 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-2">تعداد بلیت‌ها</dt>
          <dd className="font-bold text-ink">{faNumber(count)} عدد</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-2">مبلغ بلیت‌ها</dt>
          <dd className="font-bold text-ink">{faPrice(order.subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-success-fg">
            <dt>
              تخفیف{" "}
              {order.discount_code && (
                <span dir="ltr" className="font-code text-[12px]">
                  ({order.discount_code})
                </span>
              )}
            </dt>
            <dd className="font-bold" dir="ltr">
              -{faNumber(discount)} <span dir="rtl">تومان</span>
            </dd>
          </div>
        )}
        {fee > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">هزینه خدمات سامانه</dt>
            <dd className="font-bold text-ink">{faPrice(fee)}</dd>
          </div>
        )}
        <div className="border-t border-line pt-3 text-[17px] font-black text-ink">
          <dt className="inline">مبلغ نهایی: </dt>
          <dd className="inline">{faPrice(order.total_amount)}</dd>
        </div>
      </dl>
      {children}
    </section>
  );
}
