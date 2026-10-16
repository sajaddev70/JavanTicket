"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Armchair, ArrowLeft, Banknote, CalendarDays, Check, CircleX, Home, Hourglass, MapPin, RefreshCw, Ticket, Undo2 } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { errorMessage, isStatus } from "@/services/api";
import { queryKeys } from "@/constants/queryKeys";
import { useEventList } from "@/features/events/hooks";
import { seatText } from "@/components/shared/OrderSummary";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { CopyButton } from "@/components/ui/CopyButton";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/States";
import { faDateTime, faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PaymentResult } from "@/types/order";

export function PaymentResultView() {
  const id = Number(useSearchParams().get("id"));
  const result = useQuery({
    queryKey: queryKeys.payment(id),
    queryFn: () => paymentService.result(id),
    enabled: id > 0,
    staleTime: 0,
    // A payment still being verified is checked again shortly.
    refetchInterval: (q) => (q.state.data?.status === "INITIATED" ? 4000 : false),
    retry: (n, err) => !isStatus(err, 404) && n < 2,
  });

  if (!(id > 0) || isStatus(result.error, 404)) return <Unverified />;
  if (result.isError && !result.data) return <ErrorState className="container-page my-8" message={errorMessage(result.error)} onRetry={() => result.refetch()} />;
  if (!result.data) return <ResultSkeleton />;
  return (
    <div className="container-page space-y-5 pb-10 pt-5">
      <Result payment={result.data} />
      <Suggestions />
    </div>
  );
}

function Result({ payment }: { payment: PaymentResult }) {
  const o = payment.order;
  const success = payment.status === "SUCCESS";
  const pending = payment.status === "INITIATED";
  const firstTicket = o.tickets[0];
  const seats = o.quantity ? `${faNumber(o.quantity)} بلیت ورود عمومی` : o.seats.map(seatText).join("، ");
  const tone = success ? "success" : pending ? "pending" : "failed";

  const rows: { label: string; value: React.ReactNode; copy?: string }[] = [
    payment.tracking_code && { label: "شماره پیگیری", value: <span dir="ltr" className="font-code">{payment.tracking_code}</span>, copy: payment.tracking_code },
    payment.reference_id && { label: "شماره تراکنش", value: <span dir="ltr" className="font-code">{payment.reference_id}</span>, copy: payment.reference_id },
    { label: success ? "تاریخ و ساعت پرداخت" : "تاریخ و ساعت", value: faDateTime(payment.verified_at ?? payment.created_at) },
    { label: "روش پرداخت", value: payment.gateway_title },
    payment.card_pan && { label: "شماره کارت", value: <span dir="ltr" className="font-code">{payment.card_pan}</span> },
    { label: "شماره سفارش", value: <span dir="ltr" className="font-code">{o.order_number}</span>, copy: o.order_number },
  ].filter(Boolean) as { label: string; value: React.ReactNode; copy?: string }[];

  return (
    <div className="card grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section aria-labelledby="result-details" className="rounded-2xl border border-line">
        <div className={cn("flex items-center gap-4 rounded-t-2xl px-5 py-5", success ? "bg-success-bg" : pending ? "bg-warning-bg" : "bg-danger-bg")}>
          <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-full text-white", success ? "bg-success" : pending ? "bg-warning" : "bg-danger")}>
            {success ? <Check className="size-8" strokeWidth={3} /> : pending ? <Hourglass className="size-7" /> : <CircleX className="size-8" />}
          </span>
          <div>
            <h1 id="result-details" className={cn("text-[22px] font-black", success ? "text-success-fg" : pending ? "text-ink" : "text-danger-fg")}>
              {success ? "پرداخت موفق" : pending ? "در انتظار تأیید پرداخت" : "پرداخت ناموفق بود."}
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-2">
              {success ? "تراکنش شما با موفقیت انجام شد." : pending ? "نتیجه پرداخت از بانک دریافت نشده است؛ این صفحه به‌روز می‌شود." : payment.failure_reason ?? "پرداخت انجام نشد."}
            </p>
          </div>
        </div>
        <dl className="divide-y divide-line px-5 text-[14px]">
          {rows.map((r) => (
            <div key={r.label} className="flex min-h-12 items-center justify-between gap-3 py-2">
              <dt className="text-ink-2">{r.label}</dt>
              <dd className="flex items-center gap-1 text-left font-bold text-ink">
                {r.copy && <CopyButton value={r.copy} label={r.label} />}
                {r.value}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-ink-2">نام رویداد</dt>
            <dd className="flex items-center gap-3 text-left">
              <span>
                <Link href={`/events/${encodeURIComponent(o.event_slug)}`} className="block font-black text-ink hover:text-brand-600">
                  {o.event_title}
                </Link>
                {o.event_subtitle && <span className="block text-[12px] text-muted">{o.event_subtitle}</span>}
              </span>
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-field">
                <SmartImage src={mediaUrl(o.banner_url)} fallback={null} alt="" fill sizes="48px" className="object-cover" />
              </span>
            </dd>
          </div>
          <Row icon={CalendarDays} label="تاریخ و ساعت اجرا" value={`${faFullDate(o.start_time)} - ${faTime(o.start_time)}`} />
          <Row icon={MapPin} label="محل برگزاری" value={[o.hall_name, o.venue_name, o.city_name].filter(Boolean).join(" - ")} />
          <Row icon={Armchair} label={o.quantity ? "بلیت‌ها" : "صندلی‌ها"} value={seats} />
        </dl>
        <div className={cn("m-3 flex items-center justify-between rounded-2xl px-4 py-4", success ? "bg-success-bg" : "bg-surface-2")}>
          <span className={cn("flex items-center gap-2 text-[15px] font-black", success ? "text-success-fg" : "text-ink")}>
            <Banknote className="size-6" />
            {success ? "مبلغ کل پرداختی" : "مبلغ سفارش"}
          </span>
          <span className={cn("text-[22px] font-black", success ? "text-success-fg" : "text-ink")}>{faPrice(payment.amount)}</span>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center px-2 py-4 text-center" aria-live="polite">
        <Illustration tone={tone} />
        <h2 className="mt-6 text-[24px] font-black text-ink sm:text-[30px]">
          {success ? "پرداخت با موفقیت انجام شد!" : pending ? "در حال بررسی پرداخت ..." : "پرداخت ناموفق بود."}
        </h2>
        <p className="mt-3 max-w-[460px] text-[15px] leading-8 text-ink-2">
          {success
            ? "از خرید شما سپاسگزاریم. بلیت شما با موفقیت صادر شد و هم‌اکنون در بخش بلیت‌های من قابل مشاهده است."
            : pending
              ? "اگر مبلغی از حساب شما کسر شده باشد، پس از تأیید بانک بلیت صادر می‌شود."
              : "در صورت کسر مبلغ، طی ۷۲ ساعت به حساب شما بازمی‌گردد."}
        </p>
        <div className="mt-6 flex w-full max-w-[380px] flex-col gap-3">
          {success ? (
            <>
              <ButtonLink href={firstTicket ? `/tickets/${firstTicket.id}` : "/tickets"} size="xl" block>
                <Ticket className="size-5" />
                مشاهده بلیت
              </ButtonLink>
              <ButtonLink href="/" variant="outline" size="lg" block>
                <Home className="size-5" />
                بازگشت به صفحه اصلی
              </ButtonLink>
            </>
          ) : pending ? null : (
            <>
              {o.payable && (
                <ButtonLink href={`/payment?order=${encodeURIComponent(o.order_number)}`} size="xl" block>
                  <RefreshCw className="size-5" />
                  تلاش مجدد
                </ButtonLink>
              )}
              <ButtonLink href={`/orders/${encodeURIComponent(o.order_number)}`} variant="outline" size="lg" block>
                <Undo2 className="size-5" />
                بازگشت به سفارش
              </ButtonLink>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 py-2">
      <dt className="shrink-0 text-ink-2">{label}</dt>
      <dd className="flex items-center gap-2 text-left font-bold text-ink">
        {value}
        <Icon className="size-[18px] shrink-0 text-ink-2" />
      </dd>
    </div>
  );
}

/** Ticket with a check (or cross) and confetti, drawn with CSS so it follows the theme. */
function Illustration({ tone }: { tone: "success" | "failed" | "pending" }) {
  const color = tone === "success" ? "var(--success)" : tone === "failed" ? "var(--danger)" : "var(--warning)";
  const confetti = ["#1463e6", "#f59e0b", "#16a34a", "#e8143f", "#38bdf8", "#a855f7"];
  return (
    <div className="relative flex h-[220px] w-full max-w-[420px] items-center justify-center" aria-hidden>
      <div className="absolute inset-x-10 bottom-4 h-10 rounded-[50%] bg-line/70 blur-sm" />
      {tone === "success" &&
        Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className="absolute h-3 w-1.5 animate-[confetti-fall_2.6s_ease-in-out_infinite] rounded-full"
            style={{ background: confetti[i % confetti.length], left: `${8 + ((i * 47) % 84)}%`, top: `${(i * 29) % 60}%`, animationDelay: `${(i % 6) * 0.35}s` }}
          />
        ))}
      <div className="relative flex h-[120px] w-[230px] -rotate-12 items-center justify-center rounded-2xl text-white shadow-float" style={{ background: color }}>
        <span className="absolute -left-4 top-1/2 size-8 -translate-y-1/2 rounded-full bg-surface" />
        <span className="absolute -right-4 top-1/2 size-8 -translate-y-1/2 rounded-full bg-surface" />
        <span className="absolute inset-y-4 left-[30%] border-l-2 border-dashed border-white/50" />
        <span className="flex size-16 items-center justify-center rounded-full bg-white/95" style={{ color }}>
          {tone === "success" ? <Check className="size-10" strokeWidth={3.2} /> : tone === "failed" ? <CircleX className="size-10" /> : <Hourglass className="size-9" />}
        </span>
      </div>
    </div>
  );
}

function Suggestions() {
  const events = useEventList({ section: "featured", limit: 4 });
  if (!events.isLoading && !events.data?.length) return null;
  return (
    <SectionCard title="شاید به این رویدادها هم علاقه‌مند باشید" moreHref="/events" moreLabel="مشاهده همه رویدادها" headingId="suggested">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {events.isLoading ? [0, 1, 2, 3].map((i) => <EventCardSkeleton key={i} variant="featured" />) : events.data!.map((e) => <EventCard key={e.id} event={e} variant="featured" />)}
      </div>
    </SectionCard>
  );
}

function Unverified() {
  return (
    <div className="container-page py-10">
      <div className="card mx-auto max-w-[560px] p-8 text-center">
        <Illustration tone="failed" />
        <h1 className="mt-4 text-[22px] font-black text-ink">پرداخت ناموفق بود.</h1>
        <p className="mt-2 text-[14.5px] leading-7 text-ink-2">اطلاعات این پرداخت پیدا نشد. اگر مبلغی از حساب شما کسر شده است، طی ۷۲ ساعت بازمی‌گردد.</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/orders">
            سفارش‌های من
            <ArrowLeft className="size-5" />
          </ButtonLink>
          <ButtonLink href="/" variant="outline">
            صفحه اصلی
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="container-page pt-5" aria-busy>
      <div className="card grid gap-6 p-6 lg:grid-cols-2">
        <Skeleton className="h-[520px] rounded-2xl" />
        <div className="flex flex-col items-center justify-center gap-4">
          <Skeleton className="h-[200px] w-[360px] rounded-2xl" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-12 w-[380px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
