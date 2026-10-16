"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CircleCheck, CreditCard, Landmark, Lock, ReceiptText, ShieldCheck } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { errorMessage, isStatus } from "@/services/api";
import { usePageBlock } from "@/hooks/useContent";
import { useOrder, usePaymentMethods } from "@/features/checkout/queries";
import { CheckoutSkeleton, OrderUnavailable } from "@/features/checkout/CheckoutView";
import { CheckoutSteps } from "@/components/shared/CheckoutSteps";
import { OrderSummary } from "@/components/shared/OrderSummary";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { mediaUrl } from "@/lib/media";
import { faPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Order, PaymentMethod } from "@/types/order";

export function PaymentView() {
  const number = useSearchParams().get("order");
  const order = useOrder(number);
  if (!number) {
    return (
      <div className="container-page py-10">
        <EmptyState message="سفارشی برای پرداخت انتخاب نشده است." action={<ButtonLink href="/orders">سفارش‌های من</ButtonLink>} />
      </div>
    );
  }
  if (order.isError && !order.data) {
    return <ErrorState className="container-page my-8" message={isStatus(order.error, 404) ? "سفارش موردنظر پیدا نشد." : errorMessage(order.error)} onRetry={() => order.refetch()} />;
  }
  if (!order.data) return <CheckoutSkeleton />;
  return <Payment order={order.data} receivedAt={order.dataUpdatedAt} refetch={() => order.refetch()} />;
}

function Payment({ order, receivedAt, refetch }: { order: Order; receivedAt: number; refetch: () => void }) {
  const router = useRouter();
  const methods = usePaymentMethods();
  const { block: security } = usePageBlock("PAYMENT_NOTICE");
  const [chosen, setChosen] = useState<string | null>(null);
  const method = methods.data?.find((m) => m.code === (chosen ?? methods.data?.[0]?.code));
  const needsBuyer = order.payable && !order.buyer_first_name;

  // Buyer details come first (they are on the order and checked again by the backend).
  useEffect(() => {
    if (needsBuyer) router.replace(`/checkout?order=${encodeURIComponent(order.order_number)}`);
  }, [needsBuyer, order.order_number, router]);

  const start = useMutation({
    mutationFn: () => paymentService.start(order.order_number, method!.code),
    // The backend registered the payment with the gateway; the bank page takes over from here.
    onSuccess: ({ redirect_url }) => window.location.assign(redirect_url),
    onError: () => refetch(),
  });

  if (!order.payable) return <OrderUnavailable order={order} />;
  if (needsBuyer) return <CheckoutSkeleton />;

  return (
    <div className="container-page space-y-5 pb-28 pt-5 lg:pb-10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[26px] font-black text-ink sm:text-[30px]">پرداخت</h1>
          <p className="mt-1 text-[14px] text-ink-2">اطلاعات سفارش خود را بررسی کرده و پرداخت را تکمیل کنید.</p>
        </div>
        <CheckoutSteps current={2} className="w-full xl:max-w-[760px]" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <section aria-labelledby="methods-title" className="card p-4 sm:p-5">
            <h2 id="methods-title" className="mb-4 flex items-center gap-2 text-[18px] font-black text-ink">
              <CreditCard className="size-6 text-brand-600" />
              انتخاب روش پرداخت
            </h2>
            {methods.isError ? (
              <ErrorState message={errorMessage(methods.error)} onRetry={() => methods.refetch()} />
            ) : methods.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[150px] animate-pulse rounded-2xl bg-skeleton" />
                ))}
              </div>
            ) : !methods.data?.length ? (
              <EmptyState icon={Landmark} message="در حال حاضر درگاه پرداخت فعالی در دسترس نیست." description="سفارش شما تا پایان زمان نگهداری محفوظ است؛ لطفاً کمی بعد دوباره تلاش کنید." />
            ) : (
              <div role="radiogroup" aria-label="روش پرداخت" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {methods.data.map((m) => (
                  <MethodCard key={m.code} method={m} checked={m.code === method?.code} onSelect={() => setChosen(m.code)} />
                ))}
              </div>
            )}
          </section>

          {security && (
            <section aria-label={security.title ?? "امنیت پرداخت"} className="card flex items-center gap-4 bg-brand-50/50 p-4 sm:p-5">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand-600 shadow-card">
                <ShieldCheck className="size-9" />
              </span>
              <div>
                <h2 className="text-[16px] font-black text-ink">{security.title}</h2>
                {security.subtitle && <p className="mt-1.5 text-[13.5px] leading-7 text-ink-2">{security.subtitle}</p>}
              </div>
            </section>
          )}

          <section aria-labelledby="details-title" className="card p-4 sm:p-5">
            <h2 id="details-title" className="mb-3 flex items-center gap-2 text-[18px] font-black text-ink">
              <ReceiptText className="size-6 text-brand-600" />
              جزئیات پرداخت
            </h2>
            <dl className="divide-y divide-line text-[14.5px]">
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-ink-2">مبلغ نهایی سفارش:</dt>
                <dd className="text-[20px] font-black text-brand-600">{faPrice(order.total_amount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-ink-2">روش پرداخت:</dt>
                <dd className="font-bold text-ink">{method?.title ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-ink-2">زمان اعتبار سفارش:</dt>
                <dd>
                  <HoldTimer secondsLeft={order.seconds_left} receivedAt={receivedAt} onExpire={refetch} />
                </dd>
              </div>
            </dl>
            {start.isError && (
              <p role="alert" className="mt-3 rounded-xl bg-danger-bg px-4 py-3 text-[13.5px] font-semibold text-danger-fg">
                {errorMessage(start.error)}
              </p>
            )}
            <Button size="xl" block className="mt-4" disabled={!method} loading={start.isPending || start.isSuccess} onClick={() => start.mutate()}>
              <Lock className="size-5" />
              اتصال به درگاه پرداخت
              <ArrowLeft className="size-5" />
            </Button>
            {method && <p className="mt-2 text-center text-[12.5px] text-muted">با کلیک روی دکمه بالا، به صفحه امن {method.title} منتقل خواهید شد.</p>}
            <ButtonLink href={`/checkout?order=${encodeURIComponent(order.order_number)}`} variant="ghost" block className="mt-2">
              <ArrowRight className="size-5" />
              بازگشت به اطلاعات خریدار
            </ButtonLink>
          </section>
        </div>

        <OrderSummary order={order} variant="payment" className="lg:sticky lg:top-24">
          {Number(order.discount_amount) > 0 && (
            <p className="mt-4 flex items-center gap-3 rounded-2xl bg-success-bg px-4 py-3 text-[13.5px] font-bold text-success-fg">
              <CircleCheck className="size-6 shrink-0" />
              کد تخفیف <span dir="ltr" className="font-code">{order.discount_code}</span> اعمال شد!
            </p>
          )}
        </OrderSummary>
      </div>
    </div>
  );
}

function MethodCard({ method, checked, onSelect }: { method: PaymentMethod; checked: boolean; onSelect: () => void }) {
  const logo = mediaUrl(method.logo_url);
  return (
    <label
      className={cn(
        "relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition",
        checked ? "border-brand-600 bg-brand-50/40" : "border-line hover:border-brand-500/40",
      )}
    >
      <input type="radio" name="gateway" value={method.code} checked={checked} onChange={onSelect} className="absolute left-3 top-3 size-5 accent-brand-600" />
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- gateway logos come from the backend (often SVG)
        <img src={logo} alt="" className="h-12 w-auto object-contain" />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Landmark className="size-7" />
        </span>
      )}
      <span className="text-[16px] font-black text-ink">{method.title}</span>
      {method.description && <span className="text-[12.5px] leading-6 text-muted">{method.description}</span>}
    </label>
  );
}
