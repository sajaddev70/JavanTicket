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
import { useFeatures, usePageBlock, useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { mobileSchema, type MobileForm } from "@/schemas/auth";
import { loginSession, safeNext } from "./session";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SmartImage } from "@/components/ui/SmartImage";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { Button } from "@/components/ui/Button";
import { mediaUrl } from "@/lib/media";
import { normalizeIranMobile } from "@/lib/format";
import { cn } from "@/lib/cn";

export function LoginView() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const { block: hero } = usePageBlock("AUTH_HERO");
  const features = useFeatures().data?.slice(0, 3) ?? [];
  const siteName = useSiteSettings().data?.site_name;

  const form = useForm<MobileForm>({ resolver: zodResolver(mobileSchema), defaultValues: { mobile: "" } });
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

  const error = form.formState.errors.mobile?.message ?? (send.isError ? errorMessage(send.error) : undefined);

  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex items-center justify-center px-4 py-8 sm:py-12 lg:order-1 lg:bg-gradient-to-l lg:from-surface-2 lg:to-page">
        <div className="card w-full max-w-[600px] px-5 py-8 sm:px-12 sm:py-10">
          <div className="flex justify-center">
            <BrandLogo width={140} className="h-auto w-[112px] sm:w-[140px]" />
          </div>
          <h1 className="mt-5 text-center text-[26px] font-black text-ink sm:text-[30px]">ورود / ثبت‌نام</h1>
          <p className="mt-2 text-center text-[15px] text-ink-2">برای ادامه، شماره موبایل خود را وارد کنید.</p>

          <form
            noValidate
            className="mt-7"
            onSubmit={form.handleSubmit(({ mobile }) => {
              send.reset();
              send.mutate(normalizeIranMobile(mobile)!);
            })}
          >
            <label htmlFor="mobile" className="mb-2.5 block text-[15px] font-bold text-ink">
              شماره موبایل
            </label>
            <div
              dir="ltr"
              className={cn(
                "flex min-h-14 items-stretch overflow-hidden rounded-xl border bg-surface transition focus-within:ring-4",
                error ? "border-danger/60 focus-within:ring-danger/10" : "border-line-strong focus-within:border-brand-500/60 focus-within:ring-brand-500/10",
              )}
            >
              <span className="flex shrink-0 items-center gap-2 border-r border-line px-4 text-[16px] font-bold text-ink" aria-label="پیش‌شماره ایران">
                <span aria-hidden className="text-[20px] leading-none">🇮🇷</span>
                +98
              </span>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="0912 345 6789"
                maxLength={16}
                autoFocus
                aria-invalid={!!error}
                aria-describedby="mobile-help"
                className="tabular min-w-0 flex-1 bg-transparent px-4 text-left text-[17px] tracking-wide text-ink outline-none placeholder:text-muted/70"
                {...form.register("mobile", { onChange: () => send.isError && send.reset() })}
              />
            </div>
            <p id="mobile-help" role={error ? "alert" : undefined} className={cn("mt-2 text-[13px]", error ? "font-semibold text-danger-fg" : "text-muted")}>
              {error ?? "کد تأیید به این شماره ارسال خواهد شد."}
            </p>
            <Button type="submit" size="xl" block className="mt-5" loading={send.isPending}>
              {send.isPending ? "در حال ارسال کد ..." : "دریافت کد تأیید"}
              {!send.isPending && <ArrowLeft className="size-5" />}
            </Button>
          </form>

          {features.length > 0 && (
            <>
              <div className="my-6 flex items-center gap-4 text-[13px] text-muted" aria-hidden>
                <span className="h-px flex-1 bg-line" />
                یا
                <span className="h-px flex-1 bg-line" />
              </div>
              <ul className="grid grid-cols-3 divide-x divide-x-reverse divide-line text-center">
                {features.map((f) => (
                  <li key={f.id} className="px-1.5">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <SvgIcon src={f.icon_url} className="size-6" />
                    </span>
                    <p className="mt-2 text-[13px] font-black text-ink">{f.title}</p>
                    {f.description && <p className="mt-1 text-[11.5px] leading-5 text-muted">{f.description}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-6 text-center text-[13px] leading-7 text-ink-2">
            با ورود یا ثبت‌نام،{" "}
            <Link href="/terms" className="font-bold text-brand-600 hover:underline">
              قوانین و مقررات
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="font-bold text-brand-600 hover:underline">
              حریم خصوصی
            </Link>{" "}
            {siteName} را می‌پذیرید.
          </p>
        </div>
      </div>

      {hero && (
        <div className="relative hidden overflow-hidden bg-navy-950 text-white lg:order-2 lg:flex lg:flex-col lg:justify-between">
          <SmartImage src={mediaUrl(hero.image_url)} fallback={null} alt="" fill preload sizes="50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#123a8c]/90 via-[#0b2a66]/45 to-[#071834]/95" />
          <div className="relative px-12 pt-14">
            {hero.title && <h2 className="max-w-[560px] text-[40px] font-black leading-[1.45]">{hero.title}</h2>}
            {hero.subtitle && <p className="mt-4 max-w-[560px] text-[17px] leading-9 text-white/90">{hero.subtitle}</p>}
          </div>
          {features.length > 0 && (
            <ul className="relative grid grid-cols-3 divide-x divide-x-reverse divide-white/15 px-10 pb-12">
              {features.map((f) => (
                <li key={f.id} className="px-4 text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
                    <SvgIcon src={f.icon_url} className="size-6" />
                  </span>
                  <p className="mt-3 text-[15px] font-black">{f.title}</p>
                  {f.description && <p className="mt-1 text-[12.5px] text-white/75">{f.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
