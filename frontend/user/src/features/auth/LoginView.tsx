"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Smartphone } from "lucide-react";
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
  const settings = useSiteSettings().data;
  const siteName = settings?.site_name;
  const shortName = settings?.short_name;

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
    <div className="relative min-h-[100dvh] bg-surface lg:grid lg:min-h-[calc(100vh-77px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:bg-page">
      {/* Phones: the AUTH_HERO photo fades into the page behind the logo */}
      {hero?.image_url && (
        <div aria-hidden className="absolute inset-x-0 top-0 h-[300px] overflow-hidden lg:hidden">
          <SmartImage src={mediaUrl(hero.image_url)} fallback={null} alt="" fill preload sizes="100vw" className="object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/40 to-surface" />
        </div>
      )}

      <div className="relative flex flex-col items-center px-5 pb-10 pt-[calc(150px+env(safe-area-inset-top))] lg:order-1 lg:justify-center lg:pt-10">
        <div className="w-full max-w-[440px] lg:card lg:max-w-[520px] lg:px-10 lg:py-10">
          <div className="flex justify-center">
            <BrandLogo variant="auto" width={130} className="h-auto w-[118px] lg:w-[130px]" />
          </div>
          <h1 className="mt-5 text-center text-[28px] font-black text-ink">{siteName ? `ورود به ${shortName ?? siteName}` : "ورود / ثبت‌نام"}</h1>
          <p className="mx-auto mt-2 max-w-[320px] text-center text-[15px] leading-7 text-muted">با شماره همراه خود وارد شوید یا در صورت نداشتن حساب، ثبت‌نام کنید.</p>

          <form
            noValidate
            className="mt-7"
            onSubmit={form.handleSubmit(({ mobile }) => {
              send.reset();
              send.mutate(normalizeIranMobile(mobile)!);
            })}
          >
            <label htmlFor="mobile" className="sr-only">
              شماره همراه
            </label>
            <div
              className={cn(
                "flex h-[60px] items-center overflow-hidden rounded-2xl border bg-field transition focus-within:bg-surface focus-within:ring-4",
                error ? "border-danger/60 focus-within:ring-danger/10" : "border-line focus-within:border-brand-500/60 focus-within:ring-brand-500/10",
              )}
            >
              <Smartphone className="mr-4 size-6 shrink-0 text-ink-2" aria-hidden />
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="شماره همراه خود را وارد کنید"
                maxLength={16}
                autoFocus
                aria-invalid={!!error}
                aria-describedby="mobile-help"
                className="tabular h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] text-ink outline-none placeholder:text-[14.5px] placeholder:text-muted"
                {...form.register("mobile", { onChange: () => send.isError && send.reset() })}
              />
              <span dir="ltr" className="flex h-8 shrink-0 items-center border-r border-line px-4 text-[16px] font-bold text-ink" aria-label="پیش‌شماره ایران">
                +98
              </span>
            </div>
            <p id="mobile-help" role={error ? "alert" : undefined} className={cn("mt-2 min-h-5 text-[13px]", error ? "font-semibold text-danger-fg" : "text-muted")}>
              {error ?? "کد تأیید به این شماره پیامک می‌شود."}
            </p>
            <Button type="submit" size="xl" block className="mt-3 h-[60px] rounded-2xl text-[17px]" loading={send.isPending}>
              {send.isPending ? "در حال ارسال کد ..." : "دریافت کد تایید"}
              {!send.isPending && <ArrowLeft className="size-5" />}
            </Button>
          </form>

          {features.length > 0 && (
            <ul className="mt-10 grid grid-cols-3 divide-x divide-line text-center">
              {features.map((f) => (
                <li key={f.id} className="px-1.5">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <SvgIcon src={f.icon_url} className="size-6" />
                  </span>
                  <p className="mt-2.5 text-[13px] font-bold leading-5 text-ink-2">{f.title}</p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 text-center text-[12.5px] leading-7 text-muted">
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
        <div className="relative hidden overflow-hidden bg-navy-950 text-white lg:order-2 lg:flex lg:flex-col lg:justify-end">
          <SmartImage src={mediaUrl(hero.image_url)} fallback={null} alt="" fill loading="eager" sizes="50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071d3e] via-[#0b2b5b]/50 to-transparent" />
          <div className="relative px-12 pb-14">
            {hero.title && <h2 className="max-w-[560px] text-[38px] font-black leading-[1.45]">{hero.title}</h2>}
            {hero.subtitle && <p className="mt-3 max-w-[560px] text-[17px] leading-9 text-white/90">{hero.subtitle}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
