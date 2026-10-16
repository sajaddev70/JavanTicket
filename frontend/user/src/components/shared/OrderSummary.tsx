import { Armchair, CalendarDays, Clock, Layers, MapPin, ShoppingCart, Tag, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
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

/** Sidebar "خلاصه سفارش": event, seats and the amounts exactly as the backend calculated them. */
export function OrderSummary({ order, variant = "checkout", className, children }: { order: Order; variant?: "checkout" | "payment"; className?: string; children?: React.ReactNode }) {
  const count = order.quantity ?? order.seats.length;
  const tiers = [...new Set(order.seats.map((s) => s.tier_name).filter(Boolean))].join("، ");
  const sections = [...new Set(order.seats.map((s) => s.section_name).filter(Boolean))].join("، ");
  const discount = Number(order.discount_amount ?? 0);

  return (
    <aside aria-labelledby="summary-title" className={cn("card p-4 sm:p-5", className)}>
      <h2 id="summary-title" className="flex items-center gap-2 text-[18px] font-black text-ink">
        <ShoppingCart className="size-6 text-brand-600" />
        خلاصه سفارش
      </h2>

      <div className={cn("mt-4 flex gap-4", variant === "checkout" && "flex-col sm:flex-row lg:flex-col xl:flex-row")}>
        <div className={cn("relative shrink-0 overflow-hidden rounded-xl bg-field", variant === "checkout" ? "aspect-[3/4] w-full max-w-[160px]" : "aspect-square w-[120px] sm:w-[150px]")}>
          <SmartImage src={mediaUrl(order.banner_url)} fallback={null} alt={order.event_title} fill sizes="160px" className="object-cover" />
        </div>
        <div className="min-w-0 space-y-2 text-[13.5px] text-ink-2">
          <p className="text-[17px] font-black leading-7 text-ink">{order.event_title}</p>
          {order.category_name && (
            <p className="flex items-center gap-2">
              <Tag className="size-[18px] shrink-0" />
              {order.category_name}
            </p>
          )}
          <p className="flex items-center gap-2">
            <CalendarDays className="size-[18px] shrink-0" />
            {faFullDate(order.start_time)}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-[18px] shrink-0" />
            ساعت {faTime(order.start_time)}
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-[18px] shrink-0" />
            {[order.hall_name, order.venue_name].filter(Boolean).join(" - ")}
          </p>
        </div>
      </div>

      {variant === "checkout" ? (
        <dl className="mt-4 divide-y divide-line rounded-2xl bg-surface-2 px-4 text-[14px]">
          <Row icon={Users} label="تعداد بلیت‌ها" value={`${faNumber(count)} عدد`} />
          {tiers && <Row icon={Layers} label="بخش سالن" value={[tiers, sections].filter(Boolean).join(" - ")} />}
          {order.seats.length > 0 && <Row icon={Armchair} label="شماره صندلی‌ها" value={order.seats.map((s) => `${s.row_label}${faNumber(s.seat_number)}`).join("، ")} />}
        </dl>
      ) : (
        <ul className="mt-4 space-y-3 border-y border-line py-4 text-[14px]">
          {order.quantity ? (
            <li className="flex justify-between gap-3">
              <span className="font-bold text-ink">× {faNumber(order.quantity)} بلیت ورود عمومی</span>
              <span className="font-bold text-ink">{faPrice(Number(order.unit_price) * order.quantity)}</span>
            </li>
          ) : (
            seatGroups(order).map((g) => (
              <li key={g.name} className="flex justify-between gap-3">
                <span>
                  <span className="block font-bold text-ink">
                    × {faNumber(g.seats.length)} بلیت - {g.name}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{g.seats.map(seatText).join("، ")}</span>
                </span>
                <span className="shrink-0 font-bold text-ink">{faPrice(g.total)}</span>
              </li>
            ))
          )}
        </ul>
      )}

      <dl className="mt-4 space-y-3 text-[14px]">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-2">مبلغ بلیت‌ها</dt>
          <dd className="font-bold text-ink">{faPrice(order.subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-success-fg">
            <dt>تخفیف {order.discount_code && <span dir="ltr" className="font-code">({order.discount_code})</span>}</dt>
            <dd className="font-bold">- {faPrice(discount)}</dd>
          </div>
        )}
        {Number(order.service_fee) > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">هزینه خدمات سامانه</dt>
            <dd className="font-bold text-ink">{faPrice(order.service_fee)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50 px-4 py-3">
          <dt className="text-[15px] font-black text-ink">جمع کل قابل پرداخت</dt>
          <dd className="text-[20px] font-black text-brand-600">{faPrice(order.total_amount)}</dd>
        </div>
      </dl>
      {children}
    </aside>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="size-5 shrink-0 text-ink-2" />
      <dt className="shrink-0 text-ink-2">{label}</dt>
      <dd className="mr-auto text-left font-bold text-ink" dir="auto">
        {value}
      </dd>
    </div>
  );
}
