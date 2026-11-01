"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { errorMessage, isStatus } from "@/services/api";
import { queryKeys } from "@/constants/queryKeys";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { seatText } from "@/components/shared/OrderSummary";
import { CopyButton } from "@/components/ui/CopyButton";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/feedback/States";
import { LoadingOverlay, StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PaymentResult } from "@/types/order";

/**
 * Landing page of the gateway's return (/payment/result?id=): 12 پرداخت موفق and 11's پرداخت ناموفق. What it shows is
 * the backend's verification of the payment (GET /user/payments/{id}); one still being verified is polled until the bank answers.
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
  if (result.isError && !result.data) {
    return (
      <>
        <PageTopBar noBack />
        <ErrorState className="container-page" message={errorMessage(result.error)} onRetry={() => result.refetch()} />
      </>
    );
  }
  if (!result.data) {
    return (
      <>
        <PageTopBar noBack />
        <LoadingOverlay title="در حال بررسی پرداخت" message="لطفاً صفحه را نبندید." />
      </>
    );
  }
  return <Result payment={result.data} />;
}

function Result({ payment }: { payment: PaymentResult }) {
  const router = useRouter();
  const [failureSeen, setFailureSeen] = useState(false);
  const o = payment.order;
  const success = payment.status === "SUCCESS";
  const failed = !success && payment.status !== "INITIATED";
  const count = o.quantity ?? o.seats.length;
  const seats = o.quantity ? "ورود عمومی" : o.seats.map(seatText).join("، ");
  const retry = `/payment?order=${encodeURIComponent(o.order_number)}`;

  const symbol = success ? SYMBOL.success : failed ? SYMBOL.failed : SYMBOL.wait;
  const heading = success ? "پرداخت موفق!" : failed ? "پرداخت انجام نشد" : "در حال بررسی پرداخت";
  const lead = success
    ? "خرید شما با موفقیت انجام شد و بلیت‌ها آماده‌اند."
    : failed
      ? (payment.failure_reason ?? "در صورت کسر وجه، مبلغ طبق روال بانک بازمی‌گردد.")
      : "اگر مبلغی از حساب شما کسر شده باشد، پس از تأیید بانک بلیت صادر می‌شود.";

  return (
    <>
      <PageTopBar noBack />
      <div className="mx-auto w-full max-w-[640px] px-4 pb-10 pt-10 text-center sm:px-6" aria-live="polite">
        <div aria-hidden className="text-[92px] leading-[1.25]">
          {symbol}
        </div>
        <h1 className="mt-3 text-[24px] font-black text-ink">{heading}</h1>
        <p className="mt-2 text-[12px] leading-[2] text-muted">{lead}</p>

        <section className="card mt-4 p-4">
          <p className="text-[11px] text-muted">شماره سفارش</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <span dir="ltr" className="font-code text-[19px] font-black text-ink">
              {o.order_number}
            </span>
            <CopyButton value={o.order_number} label="شماره سفارش" />
          </p>
          <span className={cn("mt-1 inline-block rounded-full px-[11px] py-[5px] text-[10px]", success ? "bg-success-bg text-success-fg" : "bg-field text-ink")}>
            {success ? "پرداخت‌شده" : failed ? "پرداخت‌نشده" : "در انتظار تأیید"}
          </span>
        </section>

        <div className="mt-4 space-y-2.5">
          {success && (
            <>
              <ButtonLink href="/tickets" size="xl" block>
                مشاهده بلیت‌ها
                <ArrowLeft className="size-5" />
              </ButtonLink>
              <ButtonLink href="/" variant="outline" size="xl" block>
                بازگشت به صفحه اصلی
              </ButtonLink>
            </>
          )}
          {failed && (
            <>
              {o.payable && (
                <ButtonLink href={retry} size="xl" block>
                  تلاش مجدد
                </ButtonLink>
              )}
              <ButtonLink href={`/orders/${encodeURIComponent(o.order_number)}`} variant="outline" size="xl" block>
                بازگشت به سفارش
              </ButtonLink>
            </>
          )}
        </div>

        <section aria-label="جزئیات پرداخت" className="card mt-4 p-4 text-right">
          <dl className="divide-y divide-line text-[12.5px]">
            {payment.tracking_code && <Row label="کد رهگیری" value={payment.tracking_code} code />}
            {payment.reference_id && <Row label="شناسه تراکنش" value={payment.reference_id} code />}
            <Row label="روش پرداخت" value={payment.gateway_title} />
            <Row label="رویداد" value={o.event_title} />
            <Row label="تاریخ و ساعت اجرا" value={`${faFullDate(o.start_time)}، ساعت ${faTime(o.start_time)}`} />
            <Row label="محل برگزاری" value={[o.hall_name, o.city_name].filter(Boolean).join(" - ")} />
            <Row label="تعداد و جایگاه" value={`${faNumber(count)} بلیت - ${seats}`} />
            <Row label={success ? "مبلغ پرداختی" : "مبلغ سفارش"} value={faPrice(payment.amount)} />
          </dl>
        </section>
      </div>
      {failed && !failureSeen && (
        <StateDialog
          symbol={SYMBOL.failed}
          title="پرداخت انجام نشد"
          message="در صورت کسر وجه، مبلغ طبق روال بانک بازمی‌گردد."
          actionLabel={o.payable ? "تلاش مجدد" : "متوجه شدم"}
          onAction={() => {
            setFailureSeen(true);
            if (o.payable) router.replace(retry);
          }}
          onDismiss={() => setFailureSeen(true)}
        />
      )}
    </>
  );
}

function Row({ label, value, code }: { label: string; value: string; code?: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1 text-left font-bold text-ink">
        <span dir={code ? "ltr" : undefined} className={code ? "font-code truncate" : undefined}>
          {value}
        </span>
        {code && <CopyButton value={value} label={label} />}
      </dd>
    </div>
  );
}

/** No such payment (or not this user's). */
function Unverified() {
  return (
    <>
      <PageTopBar noBack />
      <div className="mx-auto w-full max-w-[640px] px-4 pt-10 text-center sm:px-6">
        <div aria-hidden className="text-[80px] leading-[1.25]">
          {SYMBOL.failed}
        </div>
        <h1 className="mt-3 text-[22px] font-black text-ink">پرداخت انجام نشد</h1>
        <p className="mt-2 text-[12px] leading-[2] text-muted">اطلاعات این پرداخت پیدا نشد. در صورت کسر وجه، مبلغ طبق روال بانک بازمی‌گردد.</p>
        <div className="mt-4 space-y-2.5">
          <ButtonLink href="/orders" size="xl" block>
            سفارش‌های من
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="xl" block>
            بازگشت به صفحه اصلی
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
