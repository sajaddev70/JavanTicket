"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { useOrder } from "@/features/checkout/queries";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { AccountShell } from "@/features/account/AccountShell";
import { OrderAmounts, OrderEventCard, seatText } from "@/components/shared/OrderSummary";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import { ErrorState } from "@/components/feedback/States";
import { StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage, isStatus } from "@/services/api";
import { faDateTime, faPrice } from "@/lib/format";

/** 16 جزئیات سفارش: عادی، در انتظار پرداخت، سفارش لغوشده. */
export function OrderDetailView({ number }: { number: string }) {
  const order = useOrder(number);
  const [noticeSeen, setNoticeSeen] = useState(false);
  const o = order.data;
  const pending = o?.status === "PENDING" && o.payable;

  return (
    <AccountShell title="جزئیات سفارش" fallbackHref="/orders">
      {order.isError && !o ? (
        <ErrorState message={isStatus(order.error, 404) ? "سفارش موردنظر پیدا نشد." : errorMessage(order.error)} onRetry={() => order.refetch()} />
      ) : !o ? (
        <Skeleton className="h-[480px] rounded-[20px]" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-black text-ink">اطلاعات سفارش</h2>
            <OrderStatusBadge status={o.status} />
          </div>
          <section className="card p-4">
            <dl className="text-[13px]">
              <Info label="شماره سفارش" value={o.order_number} copy ltr />
              <Info label="تاریخ" value={faDateTime(o.created_at)} />
              {o.paid_at && <Info label="تاریخ پرداخت" value={faDateTime(o.paid_at)} />}
              {o.tracking_code && <Info label="کد پیگیری" value={o.tracking_code} copy ltr />}
              {(o.buyer_first_name || o.buyer_last_name) && <Info label="نام خریدار" value={[o.buyer_first_name, o.buyer_last_name].filter(Boolean).join(" ")} />}
              {o.buyer_mobile && <Info label="موبایل خریدار" value={o.buyer_mobile} ltr />}
            </dl>
          </section>

          <OrderEventCard order={o} />

          <OrderAmounts order={o}>
            {pending && (
              <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
                زمان باقی‌مانده پرداخت:
                <HoldTimer secondsLeft={o.seconds_left} receivedAt={order.dataUpdatedAt} onExpire={() => order.refetch()} />
              </p>
            )}
            {o.status === "PENDING" && !o.payable && <p className="mt-3 text-[12px] font-bold text-ink">زمان پرداخت این سفارش به پایان رسیده و صندلی‌ها آزاد شده‌اند.</p>}
          </OrderAmounts>

          {o.tickets.length > 0 ? (
            <>
              <ButtonLink href={o.tickets.length === 1 ? `/tickets/${o.tickets[0].id}` : "/tickets"} size="xl" block>
                مشاهده بلیت‌ها
                <ArrowLeft className="size-5" />
              </ButtonLink>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {o.tickets.map((t) => (
                  <li key={t.id}>
                    <Link href={`/tickets/${t.id}`} className="flex min-h-[52px] items-center justify-between gap-3 rounded-[15px] border border-line bg-field px-3.5 py-2">
                      <span>
                        <span className="block text-[13px] font-bold text-ink">{t.seat_label}</span>
                        <span className="font-code block text-[11px] text-muted" dir="ltr">
                          {t.ticket_code}
                        </span>
                      </span>
                      <ChevronLeft className="size-4 shrink-0 text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            o.seats.length > 0 && (
              <section className="card p-4">
                <h2 className="text-[15px] font-black text-ink">صندلی‌ها</h2>
                <ul className="mt-2 space-y-2 text-[12.5px]">
                  {o.seats.map((s) => (
                    <li key={s.id} className="flex justify-between gap-3">
                      <span className="text-ink-2">{seatText(s)}</span>
                      <span className="font-bold text-ink">{faPrice(s.price)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}

          {pending && (
            <ButtonLink href={o.buyer_first_name ? `/payment?order=${encodeURIComponent(o.order_number)}` : `/checkout?order=${encodeURIComponent(o.order_number)}`} variant="success" size="xl" block>
              ادامه پرداخت
              <ArrowLeft className="size-5" />
            </ButtonLink>
          )}

          {!noticeSeen && pending && <StateDialog symbol={SYMBOL.wait} title="سفارش در انتظار پرداخت است" message="برای نهایی‌سازی، پرداخت را تکمیل کنید." onAction={() => setNoticeSeen(true)} />}
          {!noticeSeen && o.status === "CANCELLED" && <StateDialog symbol={SYMBOL.warning} title="این سفارش لغو شده است" message="جزئیات سفارش و وضعیت پرداخت را بررسی کنید." onAction={() => setNoticeSeen(true)} />}
        </div>
      )}
    </AccountShell>
  );
}

function Info({ label, value, copy, ltr }: { label: string; value: string; copy?: boolean; ltr?: boolean }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3">
      <dt className="text-ink-2">{label}:</dt>
      <dd className="flex min-w-0 items-center gap-1 font-bold text-ink">
        {copy && <CopyButton value={value} label={label} />}
        <span dir={ltr ? "ltr" : undefined} className={ltr ? "font-code" : undefined}>
          {value}
        </span>
      </dd>
    </div>
  );
}
