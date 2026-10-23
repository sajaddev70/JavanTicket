"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Clock, Pencil, RefreshCw } from "lucide-react";
import { authService } from "@/services/auth.service";
import { errorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "@/stores/useToastStore";
import { loginSession } from "./session";
import { OtpInput } from "@/components/auth/OtpInput";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { Button } from "@/components/ui/Button";
import { formatClock } from "@/hooks/useCountdown";
import { maskMobile, toFaDigits } from "@/lib/format";
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
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-surface lg:min-h-[calc(100vh-77px)] lg:bg-page">
      <PageTopBar fallbackHref="/login" />
      <Image src="/assets/auth/login-wave.svg" alt="" aria-hidden width={1200} height={320} loading="eager" className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full opacity-80 dark:opacity-20" />

      <div className="relative flex flex-1 items-start justify-center px-5 pb-16 pt-2 lg:items-center lg:py-12">
        <div className="w-full max-w-[440px] text-center lg:card lg:max-w-[520px] lg:px-10 lg:py-10">
          <Image src="/assets/illustrations/otp-message.svg" alt="" aria-hidden width={240} height={165} preload className="mx-auto h-auto w-[200px] sm:w-[230px]" />
          <h1 className="mt-4 text-[28px] font-black text-ink">تایید کد</h1>
          <p className="mx-auto mt-2 max-w-[340px] text-[15px] leading-8 text-ink-2">
            کد {LENGTH === 4 ? "چهار" : toFaDigits(String(LENGTH))} رقمی ارسال شده به شماره موبایل{" "}
            <span dir="ltr" className="tabular whitespace-nowrap font-bold text-ink">
              {mobile ? maskMobile(mobile) : "—"}
            </span>{" "}
            را وارد کنید.
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

          <p className="mt-6 text-[14.5px] text-ink-2" aria-live="polite">
            {left > 0 ? (
              <>
                ارسال مجدد کد در{" "}
                <span dir="ltr" className="tabular font-black text-brand-600">
                  {toFaDigits(formatClock(left))}
                </span>
              </>
            ) : (
              "کد را دریافت نکردید؟"
            )}
          </p>
          <button
            type="button"
            onClick={() => resend.mutate()}
            disabled={left > 0 || resend.isPending || !mobile}
            className={cn(
              "mx-auto mt-3 flex h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold transition",
              left > 0 ? "cursor-not-allowed bg-field text-muted" : "bg-brand-50 text-brand-600 hover:bg-brand-100",
            )}
          >
            {left > 0 ? <Clock className="size-5" /> : <RefreshCw className={cn("size-5", resend.isPending && "animate-spin")} />}
            ارسال مجدد کد
          </button>
          <button type="button" onClick={() => router.push("/login")} className="mx-auto mt-3 flex min-h-11 items-center gap-2 px-2 text-[14.5px] font-bold text-brand-600 hover:text-brand-700">
            <Pencil className="size-[18px]" />
            ویرایش شماره موبایل
          </button>

          <Button
            size="xl"
            block
            className="mt-5 h-[60px] rounded-2xl text-[17px]"
            onClick={() => submit(otp.join(""))}
            disabled={otp.some((d) => !d) && !verify.isPending}
            loading={verify.isPending}
          >
            {verify.isPending ? "در حال بررسی ..." : "تایید کد"}
            {!verify.isPending && <ArrowLeft className="size-5" />}
          </Button>

          <div aria-live="assertive">
            {error && (
              <div role="alert" className="mt-4 flex items-center gap-3 rounded-2xl bg-danger-bg px-4 py-3.5 text-right">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-danger text-[17px] font-black text-white" aria-hidden>
                  !
                </span>
                <div>
                  <p className="text-[14.5px] font-bold text-danger-fg">{error}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted">لطفاً دوباره تلاش کنید.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
