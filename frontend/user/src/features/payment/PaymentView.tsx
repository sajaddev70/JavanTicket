"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { errorMessage, isStatus } from "@/services/api";
import { useOrder, usePaymentMethods } from "@/features/checkout/queries";
import { CheckoutSkeleton, OrderUnavailable } from "@/features/checkout/CheckoutView";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { OrderEventCard } from "@/components/shared/OrderSummary";
import { PaymentMethodCard } from "@/components/shared/PaymentMethodCard";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { LoadingOverlay, StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { faNumber, faPrice } from "@/lib/format";
import type { Order } from "@/types/order";

export function PaymentView() {
  const number = useSearchParams().get("order");
  const order = useOrder(number);
  if (!number) {
    return (
      <>
        <PageTopBar title="پرداخت" fallbackHref="/orders" />
        <EmptyState className="container-page" symbol={SYMBOL.receipt} message="سفارشی برای پرداخت انتخاب نشده است." action={<ButtonLink href="/orders" size="xl">سفارش‌های من</ButtonLink>} />
      </>
    );
  }
  if (order.isError && !order.data) {
    return (
      <>
        <PageTopBar title="پرداخت" fallbackHref="/orders" />
        <ErrorState className="container-page" message={isStatus(order.error, 404) ? "سفارش موردنظر پیدا نشد." : errorMessage(order.error)} onRetry={() => order.refetch()} />
      </>
    );
  }
  if (!order.data) return <CheckoutSkeleton />;
  return <Payment order={order.data} receivedAt={order.dataUpdatedAt} refetch={() => order.refetch()} />;
}

/** 11 پرداخت: عادی، درگاه در دسترس نیست. (پرداخت ناموفق is shown by the result page after the bank answers.) */
function Payment({ order, receivedAt, refetch }: { order: Order; receivedAt: number; refetch: () => void }) {
  const router = useRouter();
  const methods = usePaymentMethods();
  const [chosen, setChosen] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const method = methods.data?.find((m) => m.code === (chosen ?? methods.data?.[0]?.code));
  const needsBuyer = order.payable && !order.buyer_first_name;
  const checkoutHref = `/checkout?order=${encodeURIComponent(order.order_number)}`;

  // Buyer details come first (they are on the order and checked again by the backend).
  useEffect(() => {
    if (needsBuyer) router.replace(checkoutHref);
  }, [needsBuyer, checkoutHref, router]);

  const start = useMutation({
    mutationFn: () => paymentService.start(order.order_number, method!.code),
    // The backend registered the payment with the gateway; the bank page takes over from here.
    onSuccess: ({ redirect_url }) => window.location.assign(redirect_url),
    onError: () => refetch(),
  });

  if (!order.payable) return <OrderUnavailable order={order} />;
  if (needsBuyer) return <CheckoutSkeleton />;

  const count = order.quantity ?? order.seats.length;
  const noGateway = !methods.isLoading && !methods.isError && !methods.data?.length;

  return (
    <>
      <PageTopBar title="پرداخت" fallbackHref={checkoutHref} />
      <div className="container-page mx-auto max-w-[640px] space-y-3 pb-10 pt-1.5">
        <h2 className="text-[15px] font-black text-ink">پرداخت سفارش</h2>
        <OrderEventCard order={order} />

        <section className="card p-4">
          <p className="text-[13px] text-ink">تعداد بلیت: {faNumber(count)}</p>
          <p className="mt-2 text-[13px] text-ink">مبلغ قابل پرداخت</p>
          <p className="mt-1 text-[30px] font-black leading-[1.4] text-brand-500">{faPrice(order.total_amount)}</p>
          <p className="mt-2 flex items-center gap-2 text-[12px] text-muted">
            زمان اعتبار سفارش:
            <HoldTimer secondsLeft={order.seconds_left} receivedAt={receivedAt} onExpire={refetch} />
          </p>
        </section>

        <section aria-labelledby="methods-title">
          <h2 id="methods-title" className="mb-[9px] mt-1 text-[15px] font-black text-ink">
            روش پرداخت
          </h2>
          {methods.isError ? (
            <ErrorState message={errorMessage(methods.error)} onRetry={() => methods.refetch()} />
          ) : methods.isLoading ? (
            <Skeleton className="h-[72px] rounded-[20px]" />
          ) : (
            <div role="radiogroup" aria-label="روش پرداخت" className="space-y-2.5">
              {methods.data?.map((m) => (
                <PaymentMethodCard key={m.code} method={m} checked={m.code === method?.code} onSelect={() => setChosen(m.code)} />
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-[12px] leading-[2] text-muted">
          پس از پرداخت به اپلیکیشن بازگردانده می‌شوید. با پرداخت،{" "}
          <Link href="/terms" target="_blank" className="font-bold text-brand-500 hover:underline">
            قوانین و مقررات
          </Link>{" "}
          خرید را می‌پذیرید.
        </p>
        <Button variant="success" size="xl" block disabled={!method} loading={start.isPending || start.isSuccess} onClick={() => start.mutate()}>
          پرداخت {faPrice(order.total_amount)}
          <ArrowLeft className="size-5" />
        </Button>
        <ButtonLink href={checkoutHref} variant="ghost" block>
          بازگشت به اطلاعات خریدار
        </ButtonLink>
      </div>

      {(start.isPending || start.isSuccess) && <LoadingOverlay title="در حال آماده‌سازی پرداخت" message="لطفاً صفحه را نبندید." />}
      {start.isError && (
        <StateDialog
          symbol={SYMBOL.warning}
          title="درگاه پرداخت در دسترس نیست"
          message={errorMessage(start.error)}
          actionLabel="تلاش مجدد"
          onAction={() => {
            start.reset();
            start.mutate();
          }}
          onDismiss={() => start.reset()}
        />
      )}
      {noGateway && !noticeDismissed && (
        <StateDialog
          symbol={SYMBOL.warning}
          title="درگاه پرداخت در دسترس نیست"
          message="لطفاً بعداً دوباره تلاش کنید."
          actionLabel="تلاش مجدد"
          onAction={() => methods.refetch()}
          onDismiss={() => setNoticeDismissed(true)}
        />
      )}
    </>
  );
}
