"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Armchair, Hash, Home, Hourglass, RefreshCw, Star, Undo2, X } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { errorMessage, isStatus } from "@/services/api";
import { queryKeys } from "@/constants/queryKeys";
import { seatText } from "@/components/shared/OrderSummary";
import { SmartImage } from "@/components/ui/SmartImage";
import { CopyButton } from "@/components/ui/CopyButton";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/States";
import { faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PaymentResult } from "@/types/order";

/**
 * Landing page of the gateway's return (/payment/result?id=). What it shows is the backend's verification of the
 * payment (GET /user/payments/{id}); a payment still being verified is polled until the bank answers.
 */
export function PaymentResultView() {
  const id = Number(useSearchParams().get("id"));
  const result = useQuery({
    queryKey: queryKeys.payment(id),
    queryFn: () => paymentService.result(id),
    enabled: id > 0,
    staleTime: 0,
    refetchInterval: (q) => (q.state.data?.status === "INITIATED" ? 4000 : false),
    retry: (n, err) => !isStatus(err, 404) && n < 2,
  });

  if (!(id > 0) || isStatus(result.error, 404)) return <Unverified />;
  if (result.isError && !result.data) return <ErrorState className="container-page my-8" message={errorMessage(result.error)} onRetry={() => result.refetch()} />;
  if (!result.data) return <ResultSkeleton />;
  return <Result payment={result.data} />;
}

type Tone = "success" | "failed" | "pending";

function Result({ payment }: { payment: PaymentResult }) {
  const o = payment.order;
  const tone: Tone = payment.status === "SUCCESS" ? "success" : payment.status === "INITIATED" ? "pending" : "failed";
  const firstTicket = o.tickets[0];
  const count = o.quantity ?? o.seats.length;
  const seats = o.quantity ? "ورود عمومی" : o.seats.map(seatText).join("، ");

  const codes: { icon: IconName | "hash"; label: string; value: string }[] = [
    payment.tracking_code && { icon: "common/invoice" as const, label: "کد رهگیری", value: payment.tracking_code },
    payment.reference_id && { icon: "common/credit-card" as const, label: "شناسه تراکنش", value: payment.reference_id },
    { icon: "hash" as const, label: "شماره سفارش", value: o.order_number },
  ].filter(Boolean) as { icon: IconName | "hash"; label: string; value: string }[];

  const heading = { success: "پرداخت با موفقیت انجام شد", pending: "در حال بررسی پرداخت ...", failed: "پرداخت ناموفق بود" }[tone];
  const lead = {
    success: "از همراهی شما سپاسگزاریم. بلیت شما صادر شد و در بخش بلیت‌های من در دسترس است.",
    pending: "نتیجه پرداخت هنوز از بانک دریافت نشده است؛ این صفحه خودکار به‌روز می‌شود.",
    failed: payment.failure_reason ?? "پرداخت انجام نشد. در صورت کسر مبلغ، طی ۷۲ ساعت به حساب شما بازمی‌گردد.",
  }[tone];

  return (
    <div className="mx-auto w-full max-w-[792px] px-4 sm:px-6 pb-8 pt-2 lg:pt-8" aria-live="polite">
      <div className="rounded-[24px] bg-surface-2 px-4 pb-6 pt-4 text-center">
        <Illustration tone={tone} />
        <h1 className={cn("mt-2 text-[24px] font-black sm:text-[28px]", tone === "failed" ? "text-danger-fg" : "text-ink")}>{heading}</h1>
        <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] leading-7 text-ink-2">{lead}</p>
      </div>

      <section aria-labelledby="details-title" className="card mt-3.5 p-4 sm:p-5">
        <h2 id="details-title" className="mb-2 flex items-center gap-2 text-[18px] font-black text-ink">
          <Icon name="common/invoice" className="size-[22px] text-brand-600" />
          جزئیات پرداخت
        </h2>
        <dl className="divide-y divide-line text-[14px]">
          {codes.map((c) => (
            <div key={c.label} className="flex min-h-14 items-center justify-between gap-3 py-2">
              <dt className="flex items-center gap-2 text-ink-2">
                {c.icon === "hash" ? <Hash className="size-5" /> : <Icon name={c.icon} className="size-5" />}
                {c.label}
              </dt>
              <dd className="flex min-w-0 items-center gap-1 rounded-xl bg-brand-50/70 py-1 pl-1 pr-3">
                <span dir="ltr" className="font-code truncate text-[13.5px] font-bold text-brand-700">
                  {c.value}
                </span>
                <CopyButton value={c.value} label={c.label} />
              </dd>
            </div>
          ))}
          <div className="flex min-h-14 items-center justify-between gap-3 py-2">
            <dt className="flex items-center gap-2 text-ink-2">
              <Icon name="common/wallet" className="size-5" />
              {tone === "success" ? "مبلغ پرداختی" : "مبلغ سفارش"}
            </dt>
            <dd className={cn("text-[18px] font-black", tone === "success" ? "text-success-fg" : "text-ink")}>{faPrice(payment.amount)}</dd>
          </div>
          <div className="flex items-center gap-3 py-3">
            <div className="relative aspect-[4/3] w-[110px] shrink-0 overflow-hidden rounded-xl bg-navy-900">
              <SmartImage src={mediaUrl(o.banner_url)} fallback={null} alt="" fill sizes="110px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <dt className="flex items-center gap-1.5 text-[12.5px] text-muted">
                <Star className="size-4" />
                رویداد
              </dt>
              <dd>
                <Link href={`/events/${encodeURIComponent(o.event_slug)}`} className="block text-[16px] font-black leading-7 text-ink hover:text-brand-600">
                  {o.event_title}
                </Link>
                <span className="text-[13px] text-muted">{[o.hall_name, o.city_name].filter(Boolean).join(" - ")}</span>
              </dd>
            </div>
          </div>
          <Row icon={<Icon name="common/calendar-simple" className="size-5" />} label="تاریخ و ساعت" value={`${faFullDate(o.start_time)}، ساعت ${faTime(o.start_time)}`} />
          <Row icon={<Armchair className="size-5" />} label="تعداد و جایگاه" value={`${faNumber(count)} بلیت - ${seats}`} />
          <Row icon={<Icon name="common/credit-card" className="size-5" />} label="روش پرداخت" value={payment.gateway_title} />
        </dl>

        <div className="mt-4 space-y-2.5">
          {tone === "success" ? (
            <>
              <ButtonLink href={firstTicket ? `/tickets/${firstTicket.id}` : "/tickets"} size="xl" block>
                <Icon name="common/ticket" className="size-[22px]" />
                مشاهده بلیت
              </ButtonLink>
              <ButtonLink href="/" variant="outline" size="lg" block className="border-brand-100 bg-brand-50/50 text-brand-600">
                <Home className="size-5" />
                بازگشت به خانه
              </ButtonLink>
            </>
          ) : tone === "failed" ? (
            <>
              {o.payable && (
                <ButtonLink href={`/payment?order=${encodeURIComponent(o.order_number)}`} size="xl" block>
                  <RefreshCw className="size-5" />
                  تلاش مجدد برای پرداخت
                </ButtonLink>
              )}
              <ButtonLink href={`/orders/${encodeURIComponent(o.order_number)}`} variant="outline" size="lg" block>
                <Undo2 className="size-5" />
                مشاهده سفارش
              </ButtonLink>
            </>
          ) : null}
        </div>
      </section>

      {tone === "success" && (
        <p className="mt-3.5 flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5 text-[13px] leading-6 text-ink-2">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Icon name="common/shield-check" className="size-6" />
          </span>
          بلیت‌ها همیشه در «بلیت‌های من» در دسترس هستند و از صفحه هر بلیت می‌توانید آن را به موبایل خود پیامک کنید.
        </p>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-2">
      <dt className="flex shrink-0 items-center gap-2 text-ink-2">
        {icon}
        {label}
      </dt>
      <dd className="text-left text-[13.5px] font-bold leading-6 text-ink">{value}</dd>
    </div>
  );
}

/** Success: the package's success-payment.svg with confetti; failure / pending: the same composition in their colors. */
function Illustration({ tone }: { tone: Tone }) {
  const confetti = ["#1268E8", "#F59E0B", "#16A34A", "#F43F5E", "#38BDF8", "#7C3AED"];
  return (
    <div className="relative mx-auto flex h-[150px] w-full max-w-[300px] items-center justify-center" aria-hidden>
      {tone === "success" &&
        Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className="absolute h-2.5 w-1.5 animate-[confetti-fall_2.6s_ease-in-out_infinite] rounded-full"
            style={{ background: confetti[i % confetti.length], left: `${6 + ((i * 47) % 88)}%`, top: `${(i * 29) % 55}%`, animationDelay: `${(i % 6) * 0.35}s` }}
          />
        ))}
      {tone === "success" ? (
        <Image src="/assets/illustrations/success-payment.svg" alt="" width={140} height={140} preload className="relative size-[140px]" />
      ) : (
        <span className={cn("relative flex size-[140px] items-center justify-center rounded-full", tone === "failed" ? "bg-danger-bg" : "bg-warning-bg")}>
          <span className={cn("flex size-[90px] items-center justify-center rounded-full text-white", tone === "failed" ? "bg-danger" : "bg-warning")}>
            {tone === "failed" ? <X className="size-12" strokeWidth={3} /> : <Hourglass className="size-11" />}
          </span>
        </span>
      )}
    </div>
  );
}

function Unverified() {
  return (
    <div className="mx-auto w-full max-w-[792px] px-4 sm:px-6 py-6">
      <div className="rounded-[24px] bg-surface-2 px-4 pb-6 pt-4 text-center">
        <Illustration tone="failed" />
        <h1 className="mt-2 text-[22px] font-black text-danger-fg">پرداخت ناموفق بود</h1>
        <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] leading-7 text-ink-2">اطلاعات این پرداخت پیدا نشد. اگر مبلغی از حساب شما کسر شده است، طی ۷۲ ساعت بازمی‌گردد.</p>
        <div className="mx-auto mt-5 flex max-w-[380px] flex-col gap-2.5">
          <ButtonLink href="/orders" size="lg" block>
            سفارش‌های من
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg" block>
            بازگشت به خانه
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[792px] px-4 sm:px-6 space-y-3.5 pt-2 lg:pt-8" aria-busy>
      <Skeleton className="h-[260px] rounded-[24px]" />
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  );
}
