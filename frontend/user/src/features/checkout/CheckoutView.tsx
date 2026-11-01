"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleCheck, Clock, ShieldCheck, X } from "lucide-react";
import { orderService } from "@/services/order.service";
import { errorMessage, isStatus } from "@/services/api";
import { usePageBlock } from "@/hooks/useContent";
import { useOrder, useOrderMutations } from "./queries";
import { buyerSchema, type BuyerForm } from "@/schemas/checkout";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { CheckoutSteps, InfoBanner } from "@/components/shared/CheckoutSteps";
import { OrderAmounts, OrderEventCard } from "@/components/shared/OrderSummary";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { LoadingOverlay, StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
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
    <>
      <PageTopBar title="اطلاعات خریدار" fallbackHref="/events" />
      <EmptyState className="container-page" symbol={SYMBOL.ticket} message="سفارشی برای تکمیل وجود ندارد." description="ابتدا رویداد و صندلی‌های خود را انتخاب کنید." action={<ButtonLink href="/events" size="xl">مشاهده رویدادها</ButtonLink>} />
    </>
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
      <>
        <PageTopBar title="اطلاعات خریدار" fallbackHref={`/sessions/${sessionId}/seats`} />
        <div className="container-page">
          <ErrorState message={errorMessage(create.error)} />
          <ButtonLink href={`/sessions/${sessionId}/seats`} variant="outline" size="xl" block>
            بازگشت به انتخاب صندلی
          </ButtonLink>
        </div>
      </>
    );
  }
  return (
    <>
      <PageTopBar title="اطلاعات خریدار" fallbackHref={`/sessions/${sessionId}/seats`} />
      <LoadingOverlay title="در حال ثبت سفارش" message="لطفاً صفحه را نبندید." />
    </>
  );
}

function CheckoutOrder({ number }: { number: string }) {
  const order = useOrder(number);
  if (order.isError && !order.data) {
    return (
      <>
        <PageTopBar title="اطلاعات خریدار" fallbackHref="/orders" />
        <ErrorState className="container-page" message={isStatus(order.error, 404) ? "سفارش موردنظر پیدا نشد." : errorMessage(order.error)} onRetry={() => order.refetch()} />
      </>
    );
  }
  if (!order.data) return <CheckoutSkeleton />;
  return <CheckoutSteps2 order={order.data} receivedAt={order.dataUpdatedAt} refetch={() => order.refetch()} />;
}

/** A paid order has its tickets; a cancelled or expired one has released its seats (10 "مهلت خرید تمام شد"). */
export function OrderUnavailable({ order }: { order: Order }) {
  const router = useRouter();
  if (order.status === "PAID") {
    return (
      <>
        <PageTopBar title="پرداخت" fallbackHref="/orders" />
        <EmptyState className="container-page" symbol={SYMBOL.success} message="این سفارش قبلاً پرداخت شده است." action={<ButtonLink href={`/orders/${encodeURIComponent(order.order_number)}`} size="xl">مشاهده سفارش و بلیت‌ها</ButtonLink>} />
      </>
    );
  }
  const seatsHref = order.quantity ? `/events/${encodeURIComponent(order.event_slug)}` : `/sessions/${order.session_id}/seats`;
  return (
    <>
      <PageTopBar title="خلاصه خرید" fallbackHref="/orders" />
      {order.status === "CANCELLED" ? (
        <StateDialog symbol={SYMBOL.warning} title="این سفارش لغو شده است" message="برای خرید دوباره، صندلی‌ها را از نو انتخاب کنید." onAction={() => router.replace(seatsHref)} />
      ) : (
        <StateDialog symbol={SYMBOL.wait} title="مهلت خرید تمام شد" message="برای رزرو مجدد صندلی‌ها بازگردید." onAction={() => router.replace(seatsHref)} />
      )}
    </>
  );
}

/**
 * 09 اطلاعات خریدار (عادی، خطای اعتبارسنجی، کد تخفیف اعمال‌شده) and 10 خلاصه خرید (عادی، در حال پردازش، مهلت رزرو تمام شد):
 * two steps of one order, so the form, the timer and the backend's amounts stay together.
 */
function CheckoutSteps2({ order, receivedAt, refetch }: { order: Order; receivedAt: number; refetch: () => void }) {
  const router = useRouter();
  const { block: notice } = usePageBlock("CHECKOUT_NOTICE");
  const { buyer, applyDiscount, removeDiscount } = useOrderMutations(order.order_number);
  const [step, setStep] = useState<"buyer" | "summary">("buyer");
  const [invalid, setInvalid] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
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

  if (!order.payable) return <OrderUnavailable order={order} />;

  const backHref = order.quantity ? `/events/${encodeURIComponent(order.event_slug)}` : `/sessions/${order.session_id}/seats`;
  const errors = form.formState.errors;

  const submit = form.handleSubmit(
    async (values) => {
      try {
        await buyer.mutateAsync({
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          mobile: normalizeIranMobile(values.mobile)!,
          email: values.email.trim() || null,
          note: values.note.trim() || null,
        });
        setStep("summary");
        window.scrollTo({ top: 0 });
      } catch (error) {
        toast.error(errorMessage(error));
        refetch();
      }
    },
    (e) => setInvalid(e.first_name || e.last_name || e.mobile ? "نام، نام خانوادگی و شماره موبایل الزامی هستند." : (e.email?.message ?? e.note?.message ?? e.terms?.message ?? "اطلاعات واردشده را بررسی کنید.")),
  );

  if (step === "summary") {
    return (
      <>
        <PageTopBar title="خلاصه خرید" fallbackHref={backHref} />
        <div className="container-page mx-auto max-w-[640px] space-y-3 pb-10 pt-1.5">
          <CheckoutSteps current={2} />
          <h2 className="pt-2 text-[15px] font-black text-ink">خلاصه سفارش</h2>
          <OrderEventCard order={order} />
          <OrderAmounts order={order}>
            <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
              زمان باقی‌مانده رزرو:
              <HoldTimer secondsLeft={order.seconds_left} receivedAt={receivedAt} onExpire={refetch} />
            </p>
          </OrderAmounts>
          <InfoBanner icon={<ShieldCheck className="size-[18px] shrink-0" />}>پرداخت امن و رمزنگاری‌شده</InfoBanner>
          <Button
            variant="success"
            size="xl"
            block
            loading={leaving}
            onClick={() => {
              setLeaving(true);
              router.push(`/payment?order=${encodeURIComponent(order.order_number)}`);
            }}
          >
            پرداخت و تکمیل خرید
            <ArrowLeft className="size-5" />
          </Button>
          <Button variant="ghost" block onClick={() => setStep("buyer")}>
            ویرایش اطلاعات خریدار
          </Button>
        </div>
        {leaving && <LoadingOverlay title="در حال آماده‌سازی پرداخت" message="لطفاً صفحه را نبندید." />}
      </>
    );
  }

  return (
    <>
      <PageTopBar title="اطلاعات خریدار" fallbackHref={backHref} />
      <div className="container-page mx-auto max-w-[640px] space-y-3 pb-10 pt-1.5">
        <CheckoutSteps current={1} />
        <InfoBanner icon={<Clock className="size-[18px] shrink-0" />}>
          زمان باقی‌مانده رزرو: <HoldTimer variant="text" secondsLeft={order.seconds_left} receivedAt={receivedAt} onExpire={refetch} />
        </InfoBanner>

        <form onSubmit={submit} noValidate className="space-y-[11px]">
          <h2 className="pt-2 text-[15px] font-black text-ink">اطلاعات خریدار</h2>
          <BoxField label="نام" required error={errors.first_name?.message}>
            {(p) => <input {...p} autoComplete="given-name" {...form.register("first_name")} />}
          </BoxField>
          <BoxField label="نام خانوادگی" required error={errors.last_name?.message}>
            {(p) => <input {...p} autoComplete="family-name" {...form.register("last_name")} />}
          </BoxField>
          <BoxField label="شماره موبایل" required error={errors.mobile?.message}>
            {(p) => <input {...p} type="tel" inputMode="numeric" dir="ltr" autoComplete="tel-national" className={cn(p.className, "text-right")} {...form.register("mobile")} />}
          </BoxField>
          <BoxField label="ایمیل (اختیاری)" error={errors.email?.message}>
            {(p) => <input {...p} type="email" dir="ltr" autoComplete="email" className={cn(p.className, "text-right")} {...form.register("email")} />}
          </BoxField>
          <BoxField label="یادداشت (اختیاری)" error={errors.note?.message}>
            {(p) => <input {...p} placeholder="اگر نکته‌ای برای برگزاری دارید ..." {...form.register("note")} />}
          </BoxField>

          <DiscountBox order={order} codeRef={codeRef} apply={applyDiscount} remove={removeDiscount} />

          {notice && (
            <section aria-labelledby="notice-title" className="card p-4">
              <h3 id="notice-title" className="text-[13px] font-bold text-ink">
                {notice.title}
              </h3>
              <ul className="mt-1 list-disc space-y-1 pr-4 text-[12px] leading-6 text-muted">
                {(notice.subtitle ?? "").split("\n").filter(Boolean).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          <Checkbox
            {...form.register("terms")}
            label={
              <>
                <Link href="/terms" target="_blank" className="font-bold text-brand-500 hover:underline">
                  قوانین و مقررات
                </Link>{" "}
                خرید بلیت را مطالعه کرده و با آن موافقم.
              </>
            }
          />
          {errors.terms && (
            <p role="alert" className="text-[12px] font-semibold text-danger-fg">
              {errors.terms.message}
            </p>
          )}

          <Button type="submit" size="xl" block loading={buyer.isPending}>
            ادامه به پرداخت
            <ArrowLeft className="size-5" />
          </Button>
        </form>
      </div>
      {buyer.isPending && <LoadingOverlay title="در حال آماده‌سازی پرداخت" message="لطفاً صفحه را نبندید." />}
      {invalid && <StateDialog symbol={SYMBOL.warning} title="اطلاعات را بررسی کنید" message={invalid} actionLabel="تلاش مجدد" onAction={() => setInvalid(null)} />}
    </>
  );
}

/** The design's .field: the label sits inside the box above the value. */
function BoxField({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: (props: { id: string; className: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className={cn("rounded-[13px] border bg-field px-[15px] py-2.5 transition focus-within:ring-4", error ? "border-danger/60 focus-within:ring-danger/10" : "border-line-strong focus-within:ring-brand-500/10")}>
        <label htmlFor={id} className="block text-[11px] text-muted">
          {label}
          {required && <span className="mr-0.5 text-danger-fg" aria-hidden>*</span>}
        </label>
        {children({
          id,
          className: "h-7 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-[12px] placeholder:text-muted",
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? `${id}-error` : undefined,
        })}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12px] font-medium text-danger-fg">
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
  const [justApplied, setJustApplied] = useState(false);
  const applied = !!order.discount_code && Number(order.discount_amount) > 0;
  // The code is validated and priced by the backend only; the answer is the recalculated order.
  const submit = () => {
    const code = codeRef.current?.value.trim();
    if (!code) return;
    apply.mutate(code, { onSuccess: () => setJustApplied(true) });
  };
  return (
    <section aria-label="کد تخفیف">
      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-[13px] bg-success-bg px-[15px] py-1">
          <p className="flex items-center gap-2 text-[12.5px] text-success-fg">
            <CircleCheck className="size-[18px] shrink-0" />
            <span>
              کد <b dir="ltr" className="font-code">{order.discount_code}</b> اعمال شد؛ تخفیف: <b>{faNumber(order.discount_amount)} تومان</b>
            </span>
          </p>
          <button type="button" onClick={() => remove.mutate(undefined, { onError: (e) => toast.error(errorMessage(e)) })} disabled={remove.isPending} aria-label="حذف کد تخفیف" className="flex size-11 shrink-0 items-center justify-center text-success-fg">
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex min-h-[49px] items-center gap-2 rounded-[13px] border border-line-strong bg-field px-[15px] focus-within:ring-4 focus-within:ring-brand-500/10">
            <label htmlFor="discount-code" className="sr-only">
              کد تخفیف
            </label>
            <input
              id="discount-code"
              ref={codeRef}
              autoComplete="off"
              placeholder="کد تخفیف"
              onChange={() => apply.isError && apply.reset()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              className="h-11 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-2"
            />
            <button type="button" onClick={submit} disabled={apply.isPending} className="min-h-11 shrink-0 px-2 text-[13px] font-bold text-ink disabled:opacity-50">
              {apply.isPending ? "..." : "اعمال"}
            </button>
          </div>
          {apply.isError && (
            <p role="alert" className="mt-1.5 text-[12px] font-semibold text-danger-fg">
              {errorMessage(apply.error)}
            </p>
          )}
        </>
      )}
      {justApplied && <StateDialog symbol={SYMBOL.check} title="تخفیف اعمال شد" message="مبلغ تخفیف در خلاصه سفارش محاسبه شد." onAction={() => setJustApplied(false)} />}
    </section>
  );
}

export function CheckoutSkeleton() {
  return (
    <>
      <PageTopBar title="اطلاعات خریدار" fallbackHref="/orders" />
      <div className="container-page mx-auto max-w-[640px] space-y-3 pt-1.5" aria-busy>
        <Skeleton className="h-10 rounded-[11px]" />
        <Skeleton className="h-[50px] rounded-[15px]" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[66px] rounded-[13px]" />
        ))}
      </div>
    </>
  );
}
