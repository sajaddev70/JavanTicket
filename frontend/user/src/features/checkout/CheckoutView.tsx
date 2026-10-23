"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Armchair, ArrowLeft, ArrowRight, CircleAlert, CircleCheck, Info, TimerOff, X } from "lucide-react";
import { orderService } from "@/services/order.service";
import { errorMessage, isStatus } from "@/services/api";
import { usePageBlock } from "@/hooks/useContent";
import { useOrder, useOrderMutations } from "./queries";
import { buyerSchema, type BuyerForm } from "@/schemas/checkout";
import { CheckoutSteps } from "@/components/shared/CheckoutSteps";
import { CheckoutSummary, OrderEventSummary } from "@/components/shared/OrderSummary";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useCountdown } from "@/hooks/useCountdown";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { toast } from "@/stores/useToastStore";
import { faNumber, normalizeIranMobile } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Order } from "@/types/order";

/**
 * /checkout?session=ID[&quantity=N] creates the order from this browser's held seats (or the ticket count) and
 * continues as /checkout?order=NUMBER, which shows the order the backend calculated.
 */
export function CheckoutView() {
  const search = useSearchParams();
  const number = search.get("order");
  const sessionId = Number(search.get("session"));
  if (number) return <CheckoutOrder number={number} />;
  if (sessionId > 0) return <CreateOrder sessionId={sessionId} quantity={Number(search.get("quantity")) || undefined} />;
  return (
    <div className="container-page py-10">
      <EmptyState message="سفارشی برای تکمیل وجود ندارد." description="ابتدا رویداد و صندلی‌های خود را انتخاب کنید." action={<ButtonLink href="/events">مشاهده رویدادها</ButtonLink>} />
    </div>
  );
}

function CreateOrder({ sessionId, quantity }: { sessionId: number; quantity?: number }) {
  const router = useRouter();
  const started = useRef(false);
  const create = useMutation({
    mutationFn: () => orderService.create(sessionId, quantity),
    onSuccess: ({ order_number }) => router.replace(`/checkout?order=${encodeURIComponent(order_number)}`),
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    create.mutate();
  }, [create]);

  if (create.isError) {
    return (
      <div className="container-page py-10">
        <ErrorState message={errorMessage(create.error)} />
        <div className="mt-4 flex justify-center">
          <ButtonLink href={`/sessions/${sessionId}/seats`} variant="outline">
            <ArrowRight className="size-5" />
            بازگشت به انتخاب صندلی
          </ButtonLink>
        </div>
      </div>
    );
  }
  return <CheckoutSkeleton label="در حال ثبت سفارش ..." />;
}

function CheckoutOrder({ number }: { number: string }) {
  const order = useOrder(number);
  if (order.isError && !order.data) {
    return <ErrorState className="container-page my-8" message={isStatus(order.error, 404) ? "سفارش موردنظر پیدا نشد." : errorMessage(order.error)} onRetry={() => order.refetch()} />;
  }
  if (!order.data) return <CheckoutSkeleton />;
  return <CheckoutForm order={order.data} receivedAt={order.dataUpdatedAt} refetch={() => order.refetch()} />;
}

export function OrderUnavailable({ order }: { order: Order }) {
  if (order.status === "PAID") {
    return (
      <div className="container-page py-10">
        <EmptyState message="این سفارش قبلاً پرداخت شده است." action={<ButtonLink href={`/orders/${encodeURIComponent(order.order_number)}`}>مشاهده سفارش و بلیت‌ها</ButtonLink>} />
      </div>
    );
  }
  const seatsHref = order.quantity ? `/events/${encodeURIComponent(order.event_slug)}` : `/sessions/${order.session_id}/seats`;
  return (
    <div className="container-page py-10">
      <EmptyState
        icon={TimerOff}
        message={order.status === "CANCELLED" ? "این سفارش لغو شده است." : "زمان تکمیل این سفارش به پایان رسیده است."}
        description="صندلی‌ها آزاد شده‌اند؛ برای خرید دوباره انتخاب کنید."
        action={<ButtonLink href={seatsHref}>انتخاب دوباره</ButtonLink>}
      />
    </div>
  );
}

function CheckoutForm({ order, receivedAt, refetch }: { order: Order; receivedAt: number; refetch: () => void }) {
  const router = useRouter();
  const { block: notice } = usePageBlock("CHECKOUT_NOTICE");
  const { buyer, applyDiscount, removeDiscount } = useOrderMutations(order.order_number);
  const form = useForm<BuyerForm>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      first_name: order.buyer_first_name ?? order.user_first_name ?? "",
      last_name: order.buyer_last_name ?? order.user_last_name ?? "",
      mobile: order.buyer_mobile ?? order.user_mobile,
      email: order.buyer_email ?? order.user_email ?? "",
      note: order.buyer_note ?? "",
      terms: false,
    },
  });
  const codeRef = useRef<HTMLInputElement>(null);
  const left = useCountdown(order.seconds_left, receivedAt);

  if (!order.payable) return <OrderUnavailable order={order} />;

  const backHref = order.quantity ? `/events/${encodeURIComponent(order.event_slug)}` : `/sessions/${order.session_id}/seats`;
  const errors = form.formState.errors;
  const urgent = left !== null && left <= 180;

  const submit = form.handleSubmit(async (values) => {
    try {
      await buyer.mutateAsync({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        mobile: normalizeIranMobile(values.mobile)!,
        email: values.email.trim() || null,
        note: values.note.trim() || null,
      });
      router.push(`/payment?order=${encodeURIComponent(order.order_number)}`);
    } catch (error) {
      toast.error(errorMessage(error));
      refetch();
    }
  });

  return (
    <div className="container-page space-y-3.5 pb-32 pt-3 lg:pb-10 lg:pt-6">
      <CheckoutSteps current={1} className="mx-auto max-w-[760px] rounded-2xl bg-surface-2 px-2 py-3" />

      {/* Reservation countdown: the server's deadline for this order */}
      <section aria-label="زمان رزرو" className={cn("flex items-center gap-3 rounded-2xl px-4 py-3", urgent ? "bg-danger-bg" : "bg-brand-50")}>
        <Icon name="common/clock" className={cn("size-7 shrink-0", urgent ? "text-danger-fg" : "text-brand-600")} />
        <div className="min-w-0 flex-1">
          <p className={cn("text-[14px] font-black", urgent ? "text-danger-fg" : "text-ink")}>{urgent ? "زمان رزرو در حال اتمام است!" : "صندلی‌ها برای شما رزرو شده‌اند"}</p>
          <p className="mt-0.5 text-[12px] leading-5 text-ink-2">برای تکمیل خرید، لطفاً در زمان باقی‌مانده اقدام کنید.</p>
        </div>
        <HoldTimer variant="boxes" secondsLeft={order.seconds_left} receivedAt={receivedAt} onExpire={refetch} />
      </section>

      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-5">
        <form id="checkout-form" onSubmit={submit} noValidate className="min-w-0 space-y-3.5">
          <section aria-label="رویداد" className="card p-3">
            <OrderEventSummary order={order} />
          </section>

          <section aria-labelledby="seats-title" className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="seats-title" className="text-[17px] font-black text-ink">
                {order.quantity ? "بلیت‌ها" : "صندلی‌های انتخابی"}
              </h2>
              <Link href={backHref} className="flex min-h-11 items-center gap-1.5 text-[13.5px] font-bold text-brand-600">
                <Icon name="common/edit" className="size-[18px]" />
                {order.quantity ? "تغییر تعداد" : "ویرایش صندلی‌ها"}
              </Link>
            </div>
            {order.quantity ? (
              <p className="flex items-center gap-2 rounded-xl bg-surface-2 px-3.5 py-3 text-[14px] font-bold text-ink">
                <Icon name="common/ticket" className="size-5 text-brand-600" />
                {faNumber(order.quantity)} بلیت ورود عمومی
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {order.seats.map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5 rounded-xl bg-brand-50/70 px-3 py-2.5">
                    <Armchair className="size-5 shrink-0 text-brand-600" />
                    <span className="min-w-0 text-[12.5px] leading-5 text-ink">
                      {s.section_name && <span className="block truncate text-muted">{s.section_name}</span>}
                      <b className="font-bold">
                        ردیف {s.row_label} • صندلی {faNumber(s.seat_number)}
                      </b>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="buyer-title" className="card p-4 sm:p-5">
            <h2 id="buyer-title" className="mb-3 text-[17px] font-black text-ink">
              اطلاعات خریدار
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <BoxField label="نام" required icon="common/profile" error={errors.first_name?.message}>
                {(p) => <input {...p} autoComplete="given-name" {...form.register("first_name")} />}
              </BoxField>
              <BoxField label="نام خانوادگی" required icon="common/profile" error={errors.last_name?.message}>
                {(p) => <input {...p} autoComplete="family-name" {...form.register("last_name")} />}
              </BoxField>
              <BoxField label="شماره موبایل" required icon="common/phone" error={errors.mobile?.message}>
                {(p) => <input {...p} type="tel" inputMode="numeric" dir="ltr" autoComplete="tel-national" className={cn(p.className, "text-right")} {...form.register("mobile")} />}
              </BoxField>
              <BoxField label="ایمیل (اختیاری)" icon="common/mail" error={errors.email?.message}>
                {(p) => <input {...p} type="email" dir="ltr" autoComplete="email" className={cn(p.className, "text-right")} {...form.register("email")} />}
              </BoxField>
              <BoxField label="یادداشت (اختیاری)" icon="common/edit" error={errors.note?.message} className="sm:col-span-2">
                {(p) => <input {...p} placeholder="اگر نکته‌ای برای برگزاری دارید ..." {...form.register("note")} />}
              </BoxField>
            </div>
            <div className="mt-3">
              <Checkbox
                {...form.register("terms")}
                label={
                  <>
                    <Link href="/terms" target="_blank" className="font-bold text-brand-600 hover:underline">
                      قوانین و مقررات
                    </Link>{" "}
                    خرید بلیت را مطالعه کرده و با آن موافقم.
                  </>
                }
              />
              {errors.terms && (
                <p role="alert" className="text-[12.5px] font-semibold text-danger-fg">
                  {errors.terms.message}
                </p>
              )}
            </div>
          </section>

          <DiscountBox order={order} codeRef={codeRef} apply={applyDiscount} remove={removeDiscount} />

          {notice && (
            <section aria-labelledby="notice-title" className="rounded-2xl bg-surface-2 p-4 sm:p-5">
              <h2 id="notice-title" className="mb-2 flex items-center gap-2 text-[14.5px] font-black text-ink">
                <Info className="size-[18px] text-brand-600" />
                {notice.title}
              </h2>
              <ul className="list-disc space-y-1 pr-5 text-[12.5px] leading-6 text-ink-2 marker:text-brand-600">
                {(notice.subtitle ?? "").split("\n").filter(Boolean).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}
        </form>

        <div className="space-y-3.5 lg:sticky lg:top-24">
          <CheckoutSummary order={order} />
          <Button type="submit" form="checkout-form" size="xl" block loading={buyer.isPending} className="hidden lg:flex">
            ادامه به پرداخت
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      </div>

      {/* Phones: the payable amount and the next step stay on screen */}
      <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[24px] border-t border-line bg-surface shadow-nav lg:hidden">
        <div className="container-page flex items-center gap-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          <Button type="submit" form="checkout-form" size="xl" loading={buyer.isPending} className="flex-1">
            ادامه به پرداخت
            <ArrowLeft className="size-5" />
          </Button>
          <div className="shrink-0 text-left">
            <p className="text-[11.5px] text-muted">مبلغ قابل پرداخت</p>
            <p className="whitespace-nowrap text-[18px] font-black text-brand-600">
              {faNumber(order.total_amount)} <span className="text-[12.5px] font-bold">تومان</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bordered input with an icon and its label inside the box, as on the checkout reference. */
function BoxField({
  label,
  required,
  icon,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  icon: IconName;
  error?: string;
  className?: string;
  children: (props: { id: string; className: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div
        className={cn(
          "flex min-h-[64px] items-center gap-3 rounded-2xl border bg-surface px-3.5 transition focus-within:ring-4",
          error ? "border-danger/60 focus-within:ring-danger/10" : "border-line focus-within:border-brand-500/60 focus-within:ring-brand-500/10",
        )}
      >
        <Icon name={icon} className="size-[22px] shrink-0 text-ink-2" />
        <div className="min-w-0 flex-1 py-2">
          <label htmlFor={id} className="block text-[12px] font-medium text-muted">
            {label}
            {required && <span className="mr-0.5 text-danger-fg" aria-hidden>*</span>}
          </label>
          {children({
            id,
            className: "h-7 w-full bg-transparent text-[15px] font-bold text-ink outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-muted",
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? `${id}-error` : undefined,
          })}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] font-medium text-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}

function DiscountBox({
  order,
  codeRef,
  apply,
  remove,
}: {
  order: Order;
  codeRef: React.RefObject<HTMLInputElement | null>;
  apply: ReturnType<typeof useOrderMutations>["applyDiscount"];
  remove: ReturnType<typeof useOrderMutations>["removeDiscount"];
}) {
  const applied = !!order.discount_code && Number(order.discount_amount) > 0;
  // The code is validated and priced by the backend only; the answer is the recalculated order.
  const submit = () => {
    const code = codeRef.current?.value.trim();
    if (!code) return;
    apply.mutate(code, { onSuccess: () => toast.success("کد تخفیف اعمال شد.") });
  };
  return (
    <section aria-labelledby="discount-title" className="card p-4 sm:p-5">
      <h2 id="discount-title" className="mb-3 text-[17px] font-black text-ink">
        کد تخفیف
      </h2>
      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-success-bg px-4 py-3">
          <p className="flex items-center gap-2 text-[13.5px] text-ink">
            <CircleCheck className="size-5 shrink-0 text-success-fg" />
            <span>
              کد <b dir="ltr" className="font-code">{order.discount_code}</b> اعمال شد؛ تخفیف: <b className="text-success-fg">{faNumber(order.discount_amount)} تومان</b>
            </span>
          </p>
          <button
            type="button"
            onClick={() => remove.mutate(undefined, { onError: (e) => toast.error(errorMessage(e)) })}
            disabled={remove.isPending}
            aria-label="حذف کد تخفیف"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:text-danger-fg"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="discount-code" className="sr-only">
                کد تخفیف
              </label>
              <input
                id="discount-code"
                ref={codeRef}
                dir="ltr"
                autoComplete="off"
                placeholder="کد تخفیف خود را وارد کنید"
                onChange={() => apply.isError && apply.reset()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="font-code h-[52px] w-full rounded-2xl border border-line bg-surface pl-4 pr-11 text-right text-[14px] uppercase text-ink outline-none placeholder:font-sans placeholder:normal-case placeholder:text-muted focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10"
              />
              <Icon name="common/discount" className="pointer-events-none absolute right-3.5 top-1/2 size-[22px] -translate-y-1/2 text-ink-2" />
            </div>
            <Button variant="soft" size="lg" onClick={submit} loading={apply.isPending} className="h-[52px] shrink-0 rounded-2xl px-6">
              اعمال
            </Button>
          </div>
          {apply.isError && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-danger-fg">
              <CircleAlert className="size-4" />
              {errorMessage(apply.error)}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export function CheckoutSkeleton({ label }: { label?: string }) {
  return (
    <div className="container-page space-y-5 pt-5" aria-busy>
      <Skeleton className="mx-auto h-16 max-w-[1200px] rounded-2xl" />
      {label && <p className="text-center text-[14px] font-semibold text-muted">{label}</p>}
      <div className="grid gap-5 lg:grid-cols-[1fr_430px]">
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-[18px]" />
          <Skeleton className="h-52 rounded-[18px]" />
          <Skeleton className="h-60 rounded-[18px]" />
        </div>
        <Skeleton className="h-[520px] rounded-[18px]" />
      </div>
    </div>
  );
}
