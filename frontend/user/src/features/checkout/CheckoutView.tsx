"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Armchair, ArrowLeft, ArrowRight, CalendarDays, CircleAlert, Clock, CreditCard, Info, MapPin, Percent, TimerOff, UserRound, X } from "lucide-react";
import { orderService } from "@/services/order.service";
import { errorMessage, isStatus } from "@/services/api";
import { usePageBlock } from "@/hooks/useContent";
import { useOrder, useOrderMutations } from "./queries";
import { buyerSchema, type BuyerForm } from "@/schemas/checkout";
import { CheckoutSteps } from "@/components/shared/CheckoutSteps";
import { OrderSummary, seatGroups } from "@/components/shared/OrderSummary";
import { HoldTimer } from "@/components/shared/HoldTimer";
import { SmartImage } from "@/components/ui/SmartImage";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { toast } from "@/stores/useToastStore";
import { faFullDate, faNumber, faTime, normalizeIranMobile } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
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

  if (!order.payable) return <OrderUnavailable order={order} />;

  const backHref = order.quantity ? `/events/${encodeURIComponent(order.event_slug)}` : `/sessions/${order.session_id}/seats`;
  const errors = form.formState.errors;

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
    <div className="container-page space-y-5 pb-28 pt-5 lg:pb-10">
      <CheckoutSteps current={1} className="mx-auto max-w-[1200px]" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
        <form onSubmit={submit} noValidate className="min-w-0 space-y-4">
          <div className="card flex flex-col gap-3 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-[14.5px] font-bold text-ink">لطفاً اطلاعات خود را تکمیل کرده و سفارش را بررسی کنید.</p>
                <p className="mt-0.5 text-[13px] text-ink-2">پس از تکمیل، به درگاه پرداخت منتقل خواهید شد.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-2">
              <Clock className="size-7 text-brand-600" />
              <div>
                <p className="text-[12.5px] text-ink-2">زمان باقی‌مانده برای تکمیل سفارش</p>
                <HoldTimer variant="large" secondsLeft={order.seconds_left} receivedAt={receivedAt} onExpire={refetch} />
              </div>
            </div>
          </div>

          <section aria-labelledby="event-title" className="card p-4 sm:p-5">
            <h2 id="event-title" className="mb-4 flex items-center gap-2 text-[17px] font-black text-ink">
              <CalendarDays className="size-5 text-brand-600" />
              ۱. اطلاعات رویداد و صندلی‌ها
            </h2>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="flex gap-4">
                <div className="relative aspect-[3/4] w-[110px] shrink-0 overflow-hidden rounded-xl bg-field sm:w-[130px]">
                  <SmartImage src={mediaUrl(order.banner_url)} fallback={null} alt={order.event_title} fill sizes="130px" className="object-cover" />
                </div>
                <div className="min-w-0 space-y-2.5 text-[13.5px] text-ink-2">
                  <p className="text-[16px] font-black text-ink">{order.event_title}</p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-[18px] shrink-0" />
                    {faFullDate(order.start_time)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-[18px] shrink-0" />
                    ساعت {faTime(order.start_time)}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-[18px] shrink-0" />
                    {[order.hall_name, order.venue_name].filter(Boolean).join(" - ")}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-surface-2 p-3.5">
                <h3 className="mb-2.5 flex items-center gap-2 text-[14px] font-black text-ink">
                  <Armchair className="size-5 text-brand-600" />
                  {order.quantity ? "بلیت‌ها" : "صندلی‌های انتخاب شده"}
                </h3>
                <ul className="space-y-2">
                  {order.quantity ? (
                    <li className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5 text-[13.5px]">
                      <span className="text-ink-2">ورود عمومی</span>
                      <span className="font-black text-ink">{faNumber(order.quantity)} بلیت</span>
                    </li>
                  ) : (
                    seatGroups(order).flatMap((g) =>
                      g.seats.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-[13px]">
                          <span className="text-ink-2">
                            {g.name}
                            {s.section_name && ` - ${s.section_name}`}
                          </span>
                          <span className="rounded-lg bg-brand-50 px-3 py-1 font-black text-brand-600">
                            ردیف {s.row_label} • صندلی {faNumber(s.seat_number)}
                          </span>
                        </li>
                      )),
                    )
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section aria-labelledby="buyer-title" className="card p-4 sm:p-5">
            <h2 id="buyer-title" className="mb-4 flex items-center gap-2 text-[17px] font-black text-ink">
              <UserRound className="size-5 text-brand-600" />
              ۲. اطلاعات خریدار
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="نام" required error={errors.first_name?.message}>
                {(p) => <Input {...p} autoComplete="given-name" {...form.register("first_name")} />}
              </Field>
              <Field label="نام خانوادگی" required error={errors.last_name?.message}>
                {(p) => <Input {...p} autoComplete="family-name" {...form.register("last_name")} />}
              </Field>
              <Field label="شماره موبایل" required error={errors.mobile?.message}>
                {(p) => <Input {...p} type="tel" inputMode="numeric" dir="ltr" autoComplete="tel-national" className="text-left" {...form.register("mobile")} />}
              </Field>
              <Field label="ایمیل" error={errors.email?.message} hint="برای دریافت رسید (اختیاری)">
                {(p) => <Input {...p} type="email" dir="ltr" autoComplete="email" className="text-left" {...form.register("email")} />}
              </Field>
              <Field label="یادداشت (اختیاری)" error={errors.note?.message} className="sm:col-span-2 xl:col-span-4">
                {(p) => <Textarea {...p} rows={2} placeholder="اگر نکته‌ای برای برگزاری رویداد دارید، اینجا بنویسید ..." {...form.register("note")} />}
              </Field>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {notice && (
              <section aria-labelledby="notice-title" className="card bg-surface-2/60 p-4 sm:p-5">
                <h2 id="notice-title" className="mb-3 flex items-center gap-2 text-[15px] font-black text-ink">
                  <Info className="size-5 text-brand-600" />
                  {notice.title}
                </h2>
                <ul className="list-disc space-y-1.5 pr-5 text-[13px] leading-6 text-ink-2 marker:text-brand-600">
                  {(notice.subtitle ?? "").split("\n").filter(Boolean).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            )}
            <DiscountBox order={order} codeRef={codeRef} apply={applyDiscount} remove={removeDiscount} />
          </div>

          <div className="card flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <ButtonLink href={backHref} variant="outline" size="lg">
              <ArrowRight className="size-5" />
              بازگشت
            </ButtonLink>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div>
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
              <Button type="submit" size="xl" loading={buyer.isPending} className="sm:min-w-[240px]">
                <CreditCard className="size-5" />
                ادامه به پرداخت
                <ArrowLeft className="size-5" />
              </Button>
            </div>
          </div>
        </form>

        <OrderSummary order={order} className="lg:sticky lg:top-24" />
      </div>
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
  const submit = () => {
    const code = codeRef.current?.value.trim();
    if (!code) return;
    apply.mutate(code, { onSuccess: () => toast.success("کد تخفیف اعمال شد.") });
  };
  return (
    <section aria-labelledby="discount-title" className="card border-success/25 bg-success-bg/60 p-4 sm:p-5">
      <h2 id="discount-title" className="mb-3 flex items-center gap-2 text-[15px] font-black text-success-fg">
        <Percent className="size-5" />
        کد تخفیف
      </h2>
      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3">
          <p className="text-[13.5px] text-ink">
            کد <b dir="ltr" className="font-code">{order.discount_code}</b> اعمال شد؛ تخفیف: <b className="text-success-fg">{faNumber(order.discount_amount)} تومان</b>
          </p>
          <button
            type="button"
            onClick={() => remove.mutate(undefined, { onError: (e) => toast.error(errorMessage(e)) })}
            disabled={remove.isPending}
            aria-label="حذف کد تخفیف"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger-fg"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <label htmlFor="discount-code" className="sr-only">
              کد تخفیف
            </label>
            <input
              id="discount-code"
              ref={codeRef}
              dir="ltr"
              autoComplete="off"
              placeholder="کد تخفیف را وارد کنید"
              onChange={() => apply.isError && apply.reset()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              className="font-code min-h-12 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-4 text-center text-[14px] uppercase text-ink outline-none placeholder:normal-case placeholder:text-muted focus:border-success/60 focus:ring-4 focus:ring-success/10"
            />
            <Button variant="soft" size="lg" onClick={submit} loading={apply.isPending} className="shrink-0 bg-surface text-success-fg hover:bg-success-bg">
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
