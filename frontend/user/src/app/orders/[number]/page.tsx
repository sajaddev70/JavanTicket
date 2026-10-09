'use client';

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock, CreditCard, Loader2, MapPin, Ticket, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useUserAuthStore } from "@/stores/useUserAuthStore";
import { ordersApi } from "@/services/orders";
import { faDate, faNumber, faPrice, faTime, faWeekday, toFaDigits } from "@/lib/format";
import { mediaUrl } from "@/lib/media";

export default function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const router = useRouter();
  const hydrated = useUserAuthStore((s) => s.hydrated);
  const token = useUserAuthStore((s) => s.token);

  useEffect(() => {
    if (hydrated && !token) router.replace(`/login?next=${encodeURIComponent(`/orders/${number}`)}`);
  }, [hydrated, token, number, router]);

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[860px] flex-1 px-3 py-6 sm:px-4">{token ? <OrderView number={decodeURIComponent(number)} /> : <Skeleton className="h-96 rounded-[20px]" />}</main>
      <SiteFooter />
    </div>
  );
}

function OrderView({ number }: { number: string }) {
  const order = useQuery({ queryKey: ["order", number], queryFn: () => ordersApi.get(number) });
  const pay = useMutation({ mutationFn: () => ordersApi.pay(number), onSuccess: () => order.refetch() });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (order.isError) return <ErrorState message={(order.error as { message?: string })?.message ?? "دریافت سفارش با خطا مواجه شد."} onRetry={() => order.refetch()} />;
  if (order.isLoading || !order.data) return <Skeleton className="h-96 rounded-[20px]" />;
  const o = order.data;
  const left = o.held_until ? Math.max(0, Math.floor((new Date(o.held_until).getTime() - now) / 1000)) : null;
  const expired = o.status === "PENDING" && !o.quantity && (left === null || left === 0);
  const paid = o.status === "PAID";
  const items = o.quantity
    ? [{ key: "ga", label: `${faNumber(o.quantity)} بلیت ورود عمومی`, price: Number(o.unit_price) * o.quantity }]
    : o.seats.map((s) => ({ key: String(s.id), label: `بخش ${s.tier_name ?? "—"} | ردیف ${s.row_label} | شماره ${faNumber(s.seat_number)}`, price: Number(s.price) }));

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-3">
          {paid ? <CheckCircle2 className="size-8 text-success" /> : o.status === "CANCELLED" || expired ? <XCircle className="size-8 text-danger" /> : <CreditCard className="size-8 text-brand-600" />}
          <div>
            <h1 className="text-[20px] font-black text-ink">
              {paid ? "پرداخت موفق؛ بلیت‌های شما صادر شد" : o.status === "CANCELLED" || expired ? "سفارش منقضی شد" : "تکمیل خرید"}
            </h1>
            <p className="text-[13px] text-muted" dir="ltr">
              {o.order_number}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl bg-surface-2 p-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-field">
            <SmartImage src={mediaUrl(o.banner_url)} fallback={null} alt="" fill sizes="80px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <Link href={`/events/${encodeURIComponent(o.event_slug)}`} className="font-extrabold text-ink hover:text-brand-600">
              {o.event_title}
            </Link>
            <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-muted">
              <CalendarDays className="size-4" />
              {faWeekday(o.start_time)} {faDate(o.start_time)} • ساعت {faTime(o.start_time)}
            </p>
            <p className="mt-1 flex items-center gap-2 text-[12.5px] text-muted">
              <MapPin className="size-4" />
              {o.hall_name} - {o.city_name}
            </p>
          </div>
        </div>

        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {items.map((i) => (
            <li key={i.key} className="flex items-center justify-between gap-3 px-4 py-3 text-[13.5px]">
              <span className="text-ink">{i.label}</span>
              <span className="font-bold text-ink">{faPrice(i.price)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 text-[14px]">
          {Number(o.discount_amount) > 0 && (
            <div className="flex justify-between text-success-fg">
              <dt>تخفیف ({o.discount_code})</dt>
              <dd className="font-bold">- {faPrice(Number(o.discount_amount))}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">مبلغ قابل پرداخت</dt>
            <dd className="text-[18px] font-black text-ink">{faPrice(Number(o.total_amount))}</dd>
          </div>
        </dl>

        {o.status === "PENDING" && !expired && (
          <div className="mt-4 space-y-3">
            {left !== null && (
              <p className="flex items-center justify-between rounded-xl bg-danger/5 px-4 py-3 text-[14px] font-bold text-ink">
                زمان نگهداری صندلی‌ها
                <span className="tabular flex items-center gap-2 text-danger-fg" dir="ltr">
                  <Clock className="size-4" />
                  {toFaDigits(`${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`)}
                </span>
              </p>
            )}
            {pay.isError && <p className="rounded-xl bg-danger/8 px-3 py-2 text-[13px] text-danger-fg">{(pay.error as { message?: string })?.message}</p>}
            {o.payment_available ? (
              <button
                type="button"
                onClick={() => pay.mutate()}
                disabled={pay.isPending}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-[16px] font-bold text-white shadow-cta hover:bg-brand-700 disabled:opacity-60"
              >
                {pay.isPending && <Loader2 className="size-5 animate-spin" />}
                پرداخت {faPrice(Number(o.total_amount))}
              </button>
            ) : (
              <p className="rounded-xl bg-warning/10 px-4 py-3 text-[13.5px] leading-7 text-ink">
                درگاه پرداخت هنوز به سامانه متصل نشده است. سفارش شما ثبت شده و تا پایان زمان نگهداری، صندلی‌ها برایتان رزرو می‌ماند.
              </p>
            )}
          </div>
        )}
        {expired && (
          <Link href={`/events/${encodeURIComponent(o.event_slug)}`} className="mt-4 flex h-12 items-center justify-center rounded-xl border border-line text-[15px] font-bold text-brand-600">
            انتخاب دوباره صندلی
          </Link>
        )}
      </div>

      {paid && o.tickets.length > 0 && (
        <div className="rounded-[20px] border border-line bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[17px] font-black text-ink">
            <Ticket className="size-5 -rotate-45 text-ticket" />
            بلیت‌های شما
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {o.tickets.map((t) => (
              <li key={t.ticket_code} className="rounded-xl border border-dashed border-brand-500/40 bg-brand-50/40 p-3">
                <p className="font-mono text-[14px] font-bold text-ink" dir="ltr">
                  {t.ticket_code}
                </p>
                <p className="mt-1 text-[12.5px] text-muted">{t.seat_label}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-muted">کد بلیت را هنگام ورود به سالن ارائه دهید.</p>
        </div>
      )}
    </div>
  );
}
