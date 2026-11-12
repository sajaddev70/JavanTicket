"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Armchair, ArrowLeft, Check, Hash, Home, Hourglass, RefreshCw, Star, Undo2, X } from "lucide-react";
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

  const lead = {
    success: "بلیت(ها)ی شما صادر و به بلیت‌های من اضافه شد.",
    pending: "نتیجه پرداخت هنوز از بانک دریافت نشده است؛ این صفحه خودکار به‌روز می‌شود.",
    failed: payment.failure_reason ?? "پرداخت انجام نشد. در صورت کسر مبلغ، طی ۷۲ ساعت به حساب شما بازمی‌گردد.",
  }[tone];

  const heading = { success: "پرداخت با موفقیت انجام شد!", pending: "در حال بررسی پرداخت ...", failed: "پرداخت ناموفق بود" }[tone];

  return (
    <ResultScreen tone={tone}>
      <div className="text-center text-white">
        <Illustration tone={tone} />
        <h1 className="mx-auto mt-3 max-w-[340px] text-[28px] font-black leading-[1.5] sm:max-w-none sm:text-[32px]">{heading}</h1>
        <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-8 text-white/85">{lead}</p>
      </div>

      {/* Order number card with the green check (reference 07) */}
      <div className="mt-6 flex items-center gap-3 rounded-[22px] bg-surface/95 px-5 py-4 shadow-float">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted">شماره سفارش</p>
          <p dir="ltr" className="font-code truncate text-right text-[22px] font-black text-ink">
            {o.order_number}
          </p>
        </div>
        <CopyButton value={o.order_number} label="شماره سفارش" />
        {tone === "success" && (
          <span className="bg-grad-success flex size-10 shrink-0 items-center justify-center rounded-full text-white">
            <Check className="size-6" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {tone === "success" ? (
          <>
            <ButtonLink href={firstTicket ? `/tickets/${firstTicket.id}` : "/tickets"} size="xl" block>
              مشاهده بلیت‌ها
              <ArrowLeft className="size-5" />
            </ButtonLink>
            <ButtonLink href="/" variant="glass" size="xl" block>
              <Home className="size-5" />
              بازگشت به صفحه اصلی
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
            <ButtonLink href={`/orders/${encodeURIComponent(o.order_number)}`} variant="glass" size="xl" block>
              <Undo2 className="size-5" />
              مشاهده سفارش
            </ButtonLink>
          </>
        ) : null}
      </div>

      <section aria-labelledby="details-title" className="card mt-6 p-4 sm:p-5">
        <h2 id="details-title" className="mb-2 flex items-center gap-2 text-[18px] font-black text-ink">
          <Icon name="common/invoice" className="size-[22px] text-brand-600" />
          جزئیات پرداخت
        </h2>
        <dl className="divide-y divide-line text-[14px]">
          {codes.filter((c) => c.label !== "شماره سفارش").map((c) => (
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

      </section>

      {tone === "success" && (
        <p className="mt-3.5 flex items-center gap-3 rounded-[22px] bg-surface px-4 py-3.5 text-[13px] leading-6 text-ink-2 shadow-card">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Icon name="common/shield-check" className="size-6" />
          </span>
          بلیت‌ها همیشه در «بلیت‌های من» در دسترس هستند و از صفحه هر بلیت می‌توانید آن را به موبایل خود پیامک کنید.
        </p>
      )}
    </ResultScreen>
  );
}

const SCREEN_BG: Record<Tone, string> = {
  success: "linear-gradient(180deg, #005846 0%, #0b5a5c 30%, #115465 50%, #0b3367 78%, #102b67 100%)",
  pending: "linear-gradient(180deg, #6b3e05 0%, #4a3a52 40%, #1d3470 75%, #102b67 100%)",
  failed: "linear-gradient(180deg, #7a1230 0%, #5a1d55 40%, #23306f 75%, #102b67 100%)",
};

/** Full-screen colored background of the result (reference 07: green → navy for a successful payment). */
function ResultScreen({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div className="relative isolate -mb-px min-h-[calc(100dvh-64px)] overflow-hidden lg:min-h-0" aria-live="polite">
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: SCREEN_BG[tone] }} />
      <div aria-hidden className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="mx-auto w-full max-w-[560px] px-4 pb-10 pt-[calc(24px+env(safe-area-inset-top))] sm:px-6 lg:pt-12">{children}</div>
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

/** Glowing status disc with the confetti bars of reference 07 (success); failure / pending in their colors. */
function Illustration({ tone }: { tone: Tone }) {
  const bars = [
    { c: "#FDB124", x: 78, y: 6, r: -35, w: 34 },
    { c: "#86EFAC", x: 64, y: 2, r: -20, w: 16 },
    { c: "#38BDF8", x: 18, y: 26, r: 25, w: 22 },
    { c: "#FF5A75", x: 12, y: 60, r: -15, w: 28 },
    { c: "#8E45FF", x: 84, y: 40, r: -15, w: 22 },
    { c: "#FDE047", x: 86, y: 70, r: 25, w: 20 },
    { c: "#2F80FF", x: 22, y: 84, r: -40, w: 16 },
    { c: "#FF5EC8", x: 74, y: 88, r: 30, w: 12 },
  ];
  const disc = { success: "from-[#2ee05a] to-[#0ca52d]", failed: "from-[#ff6b81] to-[#e0243f]", pending: "from-[#ffc14d] to-[#f08a1c]" }[tone];
  return (
    <div className="relative mx-auto flex h-[190px] w-full max-w-[300px] items-center justify-center" aria-hidden>
      {tone === "success" &&
        bars.map((b, i) => (
          <span
            key={i}
            className="absolute h-2.5 animate-[confetti-fall_2.8s_ease-in-out_infinite] rounded-full"
            style={{ background: b.c, left: `${b.x}%`, top: `${b.y}%`, width: b.w, transform: `rotate(${b.r}deg)`, animationDelay: `${(i % 4) * 0.4}s` }}
          />
        ))}
      <span className="absolute size-[170px] rounded-full bg-white/10 blur-2xl" />
      <span className="relative flex size-[132px] items-center justify-center rounded-full bg-white/95 p-2 shadow-[0_0_60px_rgb(120_255_150/0.45)]">
        <span className={cn("flex size-full items-center justify-center rounded-full bg-gradient-to-b text-white", disc)}>
          {tone === "success" ? <Check className="size-16" strokeWidth={3.2} /> : tone === "failed" ? <X className="size-14" strokeWidth={3} /> : <Hourglass className="size-12" />}
        </span>
      </span>
    </div>
  );
}

function Unverified() {
  return (
    <ResultScreen tone="failed">
      <div className="text-center text-white">
        <Illustration tone="failed" />
        <h1 className="mt-3 text-[26px] font-black">پرداخت ناموفق بود</h1>
        <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] leading-7 text-white/85">اطلاعات این پرداخت پیدا نشد. اگر مبلغی از حساب شما کسر شده است، طی ۷۲ ساعت بازمی‌گردد.</p>
        <div className="mx-auto mt-5 flex max-w-[380px] flex-col gap-2.5">
          <ButtonLink href="/orders" size="lg" block>
            سفارش‌های من
          </ButtonLink>
          <ButtonLink href="/" variant="glass" size="lg" block>
            بازگشت به خانه
          </ButtonLink>
        </div>
      </div>
    </ResultScreen>
  );
}

function ResultSkeleton() {
  return (
    <ResultScreen tone="pending">
      <div className="space-y-3.5" aria-busy>
        <Skeleton className="mx-auto h-[190px] w-[190px] rounded-full bg-white/15" />
        <Skeleton className="h-[80px] rounded-[22px] bg-white/15" />
        <Skeleton className="h-[320px] rounded-[22px] bg-white/15" />
      </div>
    </ResultScreen>
  );
}
