"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, CircleCheck, Landmark, Lock } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { errorMessage, isStatus } from "@/services/api";
import { usePageBlock } from "@/hooks/useContent";
import { useOrder, usePaymentMethods } from "@/features/checkout/queries";
import { CheckoutSkeleton, OrderUnavailable } from "@/features/checkout/CheckoutView";
import { CheckoutSteps } from "@/components/shared/CheckoutSteps";
import { CheckoutSummary, OrderEventSummary } from "@/components/shared/OrderSummary";
import { PaymentMethodCard } from "@/components/shared/PaymentMethodCard";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { faPrice } from "@/lib/format";
import type { Order } from "@/types/order";

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

  const payLabel = `پرداخت ${faPrice(order.total_amount)}`;

  return (
    <div className="container-page space-y-3.5 pb-32 pt-3 lg:pb-10 lg:pt-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/checkout?order=${encodeURIComponent(order.order_number)}`}
          aria-label="بازگشت به اطلاعات خریدار"
          className="flex size-11 items-center justify-center rounded-xl text-brand-600 hover:bg-brand-50"
        >
          <ChevronRight className="size-6" />
        </Link>
        <h1 className="text-[26px] font-black text-ink">پرداخت</h1>
        <CheckoutSteps current={2} className="mr-auto hidden w-full max-w-[560px] md:block" />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-5">
        <div className="min-w-0 space-y-3.5 lg:order-2">
          <CheckoutSummary
            order={order}
            showUnitPrice
            header={
              <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
                زمان باقی‌مانده برای تکمیل پرداخت
                <HoldTimer variant="chip" secondsLeft={order.seconds_left} receivedAt={receivedAt} onExpire={refetch} />
              </span>
            }
          >
            <OrderEventSummary order={order} className="mb-4 border-b border-line pb-4" />
          </CheckoutSummary>
          {Number(order.discount_amount) > 0 && (
            <p className="flex items-center gap-3 rounded-2xl bg-success-bg px-4 py-3 text-[13.5px] font-bold text-success-fg">
              <CircleCheck className="size-6 shrink-0" />
              کد تخفیف <span dir="ltr" className="font-code">{order.discount_code}</span> اعمال شد.
            </p>
          )}
        </div>

        <section aria-labelledby="methods-title" className="min-w-0 lg:order-1">
          <h2 id="methods-title" className="text-[20px] font-black text-ink">
            روش پرداخت
          </h2>
          <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
            <Lock className="size-4 shrink-0" />
            {security?.subtitle ?? "اطلاعات پرداخت شما به‌صورت امن و رمزنگاری‌شده ارسال می‌شود."}
          </p>
          <div className="mt-3.5">
            {methods.isError ? (
              <ErrorState message={errorMessage(methods.error)} onRetry={() => methods.refetch()} />
            ) : methods.isLoading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[92px] rounded-2xl" />
                ))}
              </div>
            ) : !methods.data?.length ? (
              <EmptyState icon={Landmark} message="در حال حاضر درگاه پرداخت فعالی در دسترس نیست." description="سفارش شما تا پایان زمان نگهداری محفوظ است؛ لطفاً کمی بعد دوباره تلاش کنید." />
            ) : (
              <div role="radiogroup" aria-label="روش پرداخت" className="space-y-2.5">
                {methods.data.map((m) => (
                  <PaymentMethodCard key={m.code} method={m} checked={m.code === method?.code} onSelect={() => setChosen(m.code)} />
                ))}
              </div>
            )}
          </div>

          {start.isError && (
            <p role="alert" className="mt-3 rounded-2xl bg-danger-bg px-4 py-3 text-[13.5px] font-semibold text-danger-fg">
              {errorMessage(start.error)}
            </p>
          )}
          <p className="mt-4 text-[12.5px] leading-6 text-ink-2">
            با پرداخت،{" "}
            <Link href="/terms" target="_blank" className="font-bold text-brand-600 hover:underline">
              قوانین و مقررات
            </Link>{" "}
            خرید و بازگشت وجه را می‌پذیرید. پس از پرداخت، نتیجه فقط پس از تأیید بانک نمایش داده می‌شود.
          </p>
          <Button size="xl" block className="mt-4 hidden lg:flex" disabled={!method} loading={start.isPending || start.isSuccess} onClick={() => start.mutate()}>
            {payLabel}
            <ArrowLeft className="size-5" />
          </Button>
        </section>
      </div>

      {/* Phones: the pay button stays on screen */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="container-page pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          <Button size="xl" block disabled={!method} loading={start.isPending || start.isSuccess} onClick={() => start.mutate()}>
            {payLabel}
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
