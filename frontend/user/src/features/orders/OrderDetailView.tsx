"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, CreditCard, MapPin, Ticket, UserRound } from "lucide-react";
import { useOrder } from "@/features/checkout/queries";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { AccountShell } from "@/features/account/AccountShell";
import { CheckoutSummary, OrderEventSummary, seatText } from "@/components/shared/OrderSummary";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import { ErrorState } from "@/components/feedback/States";
import { errorMessage, isStatus } from "@/services/api";
import { faDateTime, faFullDate, faPrice, faTime } from "@/lib/format";

export function OrderDetailView({ number }: { number: string }) {
  const order = useOrder(number);
  const o = order.data;

  return (
    <AccountShell title="جزئیات سفارش" actions={o && <OrderStatusBadge status={o.status} className="text-[14px]" />}>
      {order.isError && !o ? (
        <ErrorState message={isStatus(order.error, 404) ? "سفارش موردنظر پیدا نشد." : errorMessage(order.error)} onRetry={() => order.refetch()} />
      ) : !o ? (
        <Skeleton className="h-[480px] rounded-[18px]" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
          <div className="min-w-0 space-y-4">
            {o.status === "PENDING" && (
              <div className="card flex flex-col gap-3 border-warning/40 bg-warning-bg p-4 sm:flex-row sm:items-center sm:justify-between">
                {o.payable ? (
                  <>
                    <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
                      پرداخت این سفارش تکمیل نشده است.
                      <HoldTimer secondsLeft={o.seconds_left} receivedAt={order.dataUpdatedAt} onExpire={() => order.refetch()} />
                    </p>
                    <ButtonLink href={o.buyer_first_name ? `/payment?order=${encodeURIComponent(o.order_number)}` : `/checkout?order=${encodeURIComponent(o.order_number)}`}>
                      <CreditCard className="size-5" />
                      ادامه پرداخت
                    </ButtonLink>
                  </>
                ) : (
                  <p className="text-[14px] font-bold text-ink">زمان پرداخت این سفارش به پایان رسیده و صندلی‌ها آزاد شده‌اند.</p>
                )}
              </div>
            )}

            <section className="card p-4 sm:p-5" aria-labelledby="order-info">
              <h2 id="order-info" className="mb-3 text-[17px] font-black text-ink">
                اطلاعات سفارش
              </h2>
              <dl className="grid gap-x-6 text-[14px] sm:grid-cols-2">
                <Info label="شماره سفارش" value={o.order_number} copy ltr />
                <Info label="تاریخ ثبت" value={faDateTime(o.created_at)} />
                {o.paid_at && <Info label="تاریخ پرداخت" value={faDateTime(o.paid_at)} />}
                {o.tracking_code && <Info label="کد پیگیری" value={o.tracking_code} copy ltr />}
              </dl>
            </section>

            <section className="card p-4 sm:p-5" aria-labelledby="order-event">
              <h2 id="order-event" className="mb-3 text-[17px] font-black text-ink">
                <Link href={`/events/${encodeURIComponent(o.event_slug)}`} className="hover:text-brand-600">
                  {o.event_title}
                </Link>
              </h2>
              <p className="flex items-center gap-2 text-[13.5px] text-ink-2">
                <CalendarDays className="size-[18px]" />
                {faFullDate(o.start_time)} - ساعت {faTime(o.start_time)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[13.5px] text-ink-2">
                <MapPin className="size-[18px]" />
                {[o.hall_name, o.venue_name, o.city_name].filter(Boolean).join(" - ")}
              </p>
              {(o.buyer_first_name || o.buyer_mobile) && (
                <p className="mt-2 flex items-center gap-2 text-[13.5px] text-ink-2">
                  <UserRound className="size-[18px]" />
                  {[o.buyer_first_name, o.buyer_last_name].filter(Boolean).join(" ")}
                  {o.buyer_mobile && (
                    <span dir="ltr" className="text-muted">
                      {o.buyer_mobile}
                    </span>
                  )}
                </p>
              )}
            </section>

            {o.tickets.length > 0 ? (
              <section className="card p-4 sm:p-5" aria-labelledby="order-tickets">
                <h2 id="order-tickets" className="mb-3 flex items-center gap-2 text-[17px] font-black text-ink">
                  <Ticket className="size-5 text-brand-600" />
                  بلیت‌های این سفارش
                </h2>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {o.tickets.map((t) => (
                    <li key={t.id}>
                      <Link href={`/tickets/${t.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-dashed border-brand-500/40 bg-brand-50/40 px-4 py-2.5 hover:bg-brand-50">
                        <span>
                          <span className="block text-[14px] font-bold text-ink">{t.seat_label}</span>
                          <span className="font-code block text-[12px] text-muted" dir="ltr">
                            {t.ticket_code}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-[13px] font-bold text-brand-600">
                          مشاهده بلیت
                          <ChevronLeft className="size-4" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              o.seats.length > 0 && (
                <section className="card p-4 sm:p-5">
                  <h2 className="mb-3 text-[17px] font-black text-ink">صندلی‌ها</h2>
                  <ul className="space-y-2 text-[13.5px]">
                    {o.seats.map((s) => (
                      <li key={s.id} className="flex justify-between rounded-xl bg-surface-2 px-4 py-2.5">
                        <span className="text-ink">{seatText(s)}</span>
                        <span className="font-bold text-ink">{faPrice(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            )}
          </div>
          <CheckoutSummary order={o}><OrderEventSummary order={o} className="mb-4 border-b border-line pb-4" /></CheckoutSummary>
        </div>
      )}
    </AccountShell>
  );
}

function Info({ label, value, copy, ltr }: { label: string; value: string; copy?: boolean; ltr?: boolean }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line py-2">
      <dt className="text-ink-2">{label}</dt>
      <dd className="flex items-center gap-1 font-bold text-ink">
        {copy && <CopyButton value={value} label={label} />}
        <span dir={ltr ? "ltr" : undefined} className={ltr ? "font-code" : undefined}>{value}</span>
      </dd>
    </div>
  );
}
