"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Clock, Pencil, RefreshCw } from "lucide-react";
import { authService } from "@/services/auth.service";
import { errorMessage } from "@/services/api";
import { usePageBlock } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "@/stores/useToastStore";
import { loginSession } from "./session";
import { OtpInput } from "@/components/auth/OtpInput";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SmartImage } from "@/components/ui/SmartImage";
import { Button } from "@/components/ui/Button";
import { formatClock } from "@/hooks/useCountdown";
import { maskMobile, toFaDigits } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

const LENGTH = 4;
const RESEND_SECONDS = 120;
const empty = () => Array<string>(LENGTH).fill("");
const noop = () => () => {};

/** Web OTP API (Chrome on Android): reads the code from the SMS when the message ends with "@domain #code". */
function useWebOtp(onCode: (code: string) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("OTPCredential" in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions)
      .then((cred) => {
        const code = (cred as unknown as { code?: string } | null)?.code;
        if (code) onCode(code.slice(0, LENGTH));
      })
      .catch(() => {});
    return () => ac.abort();
  }, [enabled, onCode]);
}

export function VerifyView() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const { block: hero } = usePageBlock("AUTH_HERO");
  // undefined while rendering on the server; null when no sign-in is in progress.
  const mobile = useSyncExternalStore(noop, loginSession.mobile, () => undefined);
  const [otp, setOtp] = useState<string[]>(empty);
  const [deadline, setDeadline] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [left, setLeft] = useState(RESEND_SECONDS);


  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const verify = useMutation({
    mutationFn: (code: string) => authService.verifyOtp(mobile!, code),
    onSuccess: (data) => {
      signIn(data.accessToken, data.user, data.refreshToken);
      const next = loginSession.next();
      loginSession.clear();
      toast.success("ورود با موفقیت انجام شد.");
      router.replace(next);
    },
    onError: () => setOtp(empty()),
  });

  // No sign-in in progress (opened directly or after a refresh in another tab): start over.
  // Not after success, when the pending number has just been cleared on the way to the next page.
  useEffect(() => {
    if (mobile === null && !verify.isSuccess) router.replace("/login");
  }, [mobile, verify.isSuccess, router]);

  const resend = useMutation({
    mutationFn: () => authService.sendOtp(mobile!),
    onSuccess: () => {
      setDeadline(Date.now() + RESEND_SECONDS * 1000);
      setOtp(empty());
      verify.reset();
      toast.success("کد تأیید جدید ارسال شد.");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submit = useCallback(
    (code: string) => {
      if (!mobile || verify.isPending || code.length !== LENGTH) return;
      verify.mutate(code);
    },
    [mobile, verify],
  );

  const fillFromSms = useCallback(
    (code: string) => {
      setOtp(code.split(""));
      submit(code);
    },
    [submit],
  );
  useWebOtp(fillFromSms, !!mobile);

  const error = verify.isError ? errorMessage(verify.error) : "";

  return (
    <div className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-10 sm:py-16">
      {/* Decorative background from the AUTH_HERO block, faded towards the card */}
      <div aria-hidden className="absolute inset-0">
        {hero?.image_url && <SmartImage src={mediaUrl(hero.image_url)} fallback={null} alt="" fill sizes="100vw" className="object-cover opacity-35 dark:opacity-20" />}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--page)_35%,color-mix(in_srgb,var(--page)_70%,transparent)_70%)]" />
        <Image src="/assets/auth/login-wave.svg" alt="" width={1200} height={320} className="absolute inset-x-0 bottom-0 h-auto w-full opacity-70 dark:opacity-20" />
      </div>

      <div className="card relative w-full max-w-[580px] px-5 py-9 text-center sm:px-14 sm:py-10">
        <div className="flex justify-center">
          <BrandLogo width={130} className="h-auto w-[110px] sm:w-[130px]" />
        </div>
        <h1 className="mt-5 text-[24px] font-black text-ink sm:text-[28px]">کد تأیید را وارد کنید</h1>
        <p className="mt-3 text-[15px] text-ink-2">
          یک کد {toFaDigits(String(LENGTH))} رقمی به شماره{" "}
          <span dir="ltr" className="tabular font-bold text-ink">
            {mobile ? maskMobile(mobile) : "—"}
          </span>{" "}
          ارسال شد.
        </p>

        <div className="mt-7">
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              if (verify.isError) verify.reset();
            }}
            onComplete={submit}
            disabled={verify.isPending || !mobile}
            invalid={!!error}
          />
        </div>
        <p className="mt-3 min-h-6 text-[14px] font-semibold text-danger-fg" role="alert" aria-live="assertive">
          {error}
        </p>

        <p className="mt-2 flex items-center justify-center gap-2 text-[14.5px] text-ink-2" aria-live="polite">
          <Clock className="size-5" />
          {left > 0 ? (
            <>
              ارسال مجدد کد در
              <span dir="ltr" className="tabular font-black text-brand-600">
                {toFaDigits(formatClock(left))}
              </span>
            </>
          ) : (
            "کد را دریافت نکردید؟"
          )}
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-[14.5px] font-bold">
          <button
            type="button"
            onClick={() => resend.mutate()}
            disabled={left > 0 || resend.isPending || !mobile}
            className={cn("flex min-h-11 items-center gap-2 px-2", left > 0 ? "cursor-not-allowed text-brand-600/40" : "text-brand-600 hover:text-brand-700")}
          >
            <RefreshCw className={cn("size-5", resend.isPending && "animate-spin")} />
            ارسال مجدد کد
          </button>
          <span className="h-6 w-px bg-line-strong" aria-hidden />
          <button type="button" onClick={() => router.push("/login")} className="flex min-h-11 items-center gap-2 px-2 text-brand-600 hover:text-brand-700">
            <Pencil className="size-5" />
            تغییر شماره موبایل
          </button>
        </div>

        <Button size="xl" block className="mt-6" onClick={() => submit(otp.join(""))} disabled={otp.some((d) => !d)} loading={verify.isPending}>
          {verify.isPending ? "در حال بررسی ..." : "ورود به حساب"}
          {!verify.isPending && <ChevronLeft className="size-5" />}
        </Button>
      </div>
    </div>
  );
}
