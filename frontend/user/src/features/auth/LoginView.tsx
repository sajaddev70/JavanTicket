"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";
import { errorMessage } from "@/services/api";
import { useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { mobileSchema, type MobileForm } from "@/schemas/auth";
import { loginSession, safeNext } from "./session";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { LoadingOverlay, StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { normalizeIranMobile } from "@/lib/format";
import { cn } from "@/lib/cn";

/** 02 ورود و ثبت‌نام: عادی، شماره نامعتبر، در حال ارسال کد. */
export function LoginView() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const siteName = useSiteSettings().data?.site_name;

  const form = useForm<MobileForm>({ resolver: zodResolver(mobileSchema), defaultValues: { mobile: "" }, reValidateMode: "onSubmit" });
  const send = useMutation({
    mutationFn: (mobile: string) => authService.sendOtp(mobile),
    onSuccess: (_d, mobile) => {
      loginSession.start(mobile, next);
      router.push("/verify");
    },
  });

  useEffect(() => {
    if (authenticated) router.replace(next);
  }, [authenticated, next, router]);

  const invalid = !!form.formState.errors.mobile;

  return (
    <>
      <PageTopBar fallbackHref="/" />
      <div className="mx-auto w-full max-w-[440px] px-4 pb-10 pt-14 lg:pt-10">
        <div className="text-center">
          <BrandMark className="mx-auto w-[110px]" />
          <h1 className="mt-4 text-[24px] font-black text-ink">ورود به حساب کاربری</h1>
          <p className="mt-1 text-[12px] leading-[2] text-muted">با شماره موبایل خود وارد شوید</p>
        </div>

        <form
          noValidate
          className="mt-10"
          onSubmit={form.handleSubmit(({ mobile }) => {
            send.reset();
            send.mutate(normalizeIranMobile(mobile)!);
          })}
        >
          <label htmlFor="mobile" className="mb-[7px] block text-[11px] text-muted">
            شماره موبایل
          </label>
          <div className={cn("flex min-h-[49px] items-center rounded-[13px] border bg-field px-[15px] focus-within:ring-4 focus-within:ring-brand-500/10", invalid ? "border-danger/60" : "border-line-strong")} dir="ltr">
            <span className="text-[14px] font-bold text-ink" aria-label="پیش‌شماره ایران">
              +98
            </span>
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="0912 123 4567"
              maxLength={16}
              autoFocus
              aria-invalid={invalid}
              className="tabular h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-muted/70"
              {...form.register("mobile", { onChange: () => send.isError && send.reset() })}
            />
          </div>
          <Button type="submit" size="xl" block className="mt-4" loading={send.isPending}>
            دریافت کد تأیید
            {!send.isPending && <ArrowLeft className="size-5" />}
          </Button>
        </form>

        <p className="mt-4 text-center text-[12px] leading-[2] text-muted">
          ورود به معنای پذیرش{" "}
          <Link href="/terms" className="font-bold text-brand-500 hover:underline">
            قوانین و مقررات
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="font-bold text-brand-500 hover:underline">
            حریم خصوصی
          </Link>{" "}
          {siteName} است.
        </p>
      </div>

      {send.isPending && <LoadingOverlay title="در حال ارسال پیامک" message="کد تأیید برای شماره شما ارسال می‌شود." />}
      {invalid && <StateDialog symbol={SYMBOL.warning} title="شماره موبایل نامعتبر است" message="شماره موبایل را با فرمت صحیح وارد کنید." actionLabel="تلاش مجدد" onAction={() => form.clearErrors()} />}
      {send.isError && <StateDialog symbol={SYMBOL.warning} title="ارسال کد انجام نشد" message={errorMessage(send.error)} actionLabel="تلاش مجدد" onAction={() => send.reset()} />}
    </>
  );
}
