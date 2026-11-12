"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";
import { errorMessage } from "@/services/api";
import { useFeatures, usePageBlock, useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { mobileSchema, type MobileForm } from "@/schemas/auth";
import { loginSession, safeNext } from "./session";
import { BrandMark } from "@/components/ui/BrandMark";
import { SmartImage } from "@/components/ui/SmartImage";
import { SvgIcon } from "@/components/ui/SvgIcon";
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
  const kicker = siteName && shortName && siteName.includes(shortName) && siteName.trim() !== shortName ? siteName.replace(shortName, "").trim() : null;

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
    <div
      className="relative isolate min-h-[100dvh] overflow-hidden text-white lg:grid lg:min-h-[calc(100vh-78px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
      style={{ background: "linear-gradient(180deg, #0f2a68 0%, #1d47a6 30%, #4a63c7 55%, #8a6fd6 72%, #e58fbf 88%, #f6b48a 100%)" }}
    >
      {/* Reference 13: the AUTH_HERO photo (admin panel) rises from the bottom of the screen */}
      {hero?.image_url && (
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[46%] [mask-image:linear-gradient(to_bottom,transparent,#000_45%)] lg:hidden">
          <SmartImage src={mediaUrl(hero.image_url)} fallback={null} alt="" fill preload sizes="100vw" className="object-cover object-bottom" />
        </div>
      )}
      <div aria-hidden className="absolute -left-20 top-24 -z-10 size-72 rounded-full bg-[#6eb8ff]/25 blur-3xl" />

      <div className="relative flex flex-col items-center px-5 pb-[38vh] pt-[calc(28px+env(safe-area-inset-top))] lg:order-1 lg:justify-center lg:pb-10 lg:pt-10">
        <div className="w-full max-w-[440px]">
          {/* Stacked logo (javan_logo_stacked) in its light version */}
          <Link href="/" aria-label="صفحه اصلی" className="flex flex-col items-center">
            <BrandMark tone="light" className="w-[92px]" />
            {kicker && <span className="mt-1 text-[11px] font-bold text-white/90">{kicker}</span>}
            {shortName && <span className="text-[30px] font-black leading-tight">{shortName}</span>}
          </Link>
          <h1 className="mt-4 text-center text-[30px] font-black">{siteName ? `ورود به ${shortName ?? siteName}` : "ورود / ثبت‌نام"}</h1>
          <p className="mx-auto mt-1.5 max-w-[320px] text-center text-[15px] leading-7 text-white/85">با شماره موبایل خود وارد شوید.</p>

          <form
            noValidate
            className="mt-6"
            onSubmit={form.handleSubmit(({ mobile }) => {
              send.reset();
              send.mutate(normalizeIranMobile(mobile)!);
            })}
          >
            <label htmlFor="mobile" className="sr-only">
              شماره موبایل
            </label>
            <div
              className={cn(
                "glass flex h-[60px] items-center overflow-hidden rounded-[20px] transition focus-within:ring-4",
                error ? "border-[#ff9aaa] focus-within:ring-[#ff5a75]/25" : "focus-within:bg-white/20 focus-within:ring-white/15",
              )}
            >
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="شماره موبایل"
                maxLength={16}
                autoFocus
                aria-invalid={!!error}
                aria-describedby="mobile-help"
                className="tabular h-full min-w-0 flex-1 bg-transparent px-5 text-[17px] text-white outline-none placeholder:text-[15px] placeholder:text-white/75"
                {...form.register("mobile", { onChange: () => send.isError && send.reset() })}
              />
              <span dir="ltr" className="flex h-full shrink-0 items-center bg-[#0f2a68]/80 px-5 text-[17px] font-black" aria-label="پیش‌شماره ایران">
                +98
              </span>
            </div>
            <p id="mobile-help" role={error ? "alert" : undefined} className={cn("mt-2 min-h-5 text-[13px]", error ? "font-bold text-[#ffd0d8]" : "text-white/75")}>
              {error ?? "کد تأیید به این شماره پیامک می‌شود."}
            </p>
            <button
              type="submit"
              disabled={send.isPending}
              aria-busy={send.isPending || undefined}
              className="bg-grad-login mt-2 flex h-[60px] w-full items-center justify-center gap-2 rounded-[20px] text-[18px] font-black text-white shadow-[0_12px_30px_rgb(200_90_220/0.4)] transition hover:brightness-105 disabled:opacity-70"
            >
              {send.isPending && <Loader2 className="size-5 animate-spin" aria-hidden />}
              {send.isPending ? "در حال ارسال کد ..." : "دریافت کد تایید"}
            </button>
          </form>

          {features.length > 0 && (
            <>
              <div className="mt-6 flex items-center gap-3 text-[13px] text-white/75" aria-hidden>
                <span className="h-px flex-1 bg-gradient-to-l from-white/50 to-transparent" />
                با
                <span className="h-px flex-1 bg-gradient-to-r from-white/50 to-transparent" />
              </div>
              <ul className="mt-3 grid grid-cols-3 rounded-[22px] bg-white/90 px-2 py-4 text-center shadow-float dark:bg-surface/90">
                {features.map((f) => (
                  <li key={f.id} className="px-1">
                    <span className="mx-auto flex size-12 items-center justify-center text-purple">
                      <SvgIcon src={f.icon_url} className="size-8" />
                    </span>
                    <p className="mt-1 text-[12.5px] font-black leading-5 text-navy-900 dark:text-ink">{f.title}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-5 text-center text-[12px] leading-6 text-white/80">
            با ورود یا ثبت‌نام،{" "}
            <Link href="/terms" className="font-bold text-white underline-offset-4 hover:underline">
              قوانین و مقررات
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="font-bold text-white underline-offset-4 hover:underline">
              حریم خصوصی
            </Link>{" "}
            {siteName} را می‌پذیرید.
          </p>
        </div>
      </div>

      {hero && (
        <div className="relative m-6 hidden overflow-hidden rounded-[30px] bg-navy-950 shadow-float lg:order-2 lg:flex lg:flex-col lg:justify-end">
          <SmartImage src={mediaUrl(hero.image_url)} fallback={null} alt="" fill loading="eager" sizes="50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102b67] via-[#102b67]/40 to-transparent" />
          <div className="relative px-12 pb-14">
            {hero.title && <h2 className="max-w-[560px] text-[38px] font-black leading-[1.45]">{hero.title}</h2>}
            {hero.subtitle && <p className="mt-3 max-w-[560px] text-[17px] leading-9 text-white/90">{hero.subtitle}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
