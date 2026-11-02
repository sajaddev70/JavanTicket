"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { authService } from "@/services/auth.service";
import { errorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "@/stores/useToastStore";
import { loginSession } from "./session";
import { OtpInput } from "@/components/auth/OtpInput";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { Button } from "@/components/ui/Button";
import { formatClock } from "@/hooks/useCountdown";
import { maskMobile, toFaDigits } from "@/lib/format";

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

/** 03 تأیید شماره موبایل: عادی، کد اشتباه، انقضای کد، تأیید موفق. */
export function VerifyView() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  // undefined while rendering on the server; null when no sign-in is in progress.
  const mobile = useSyncExternalStore(noop, loginSession.mobile, () => undefined);
  const [otp, setOtp] = useState<string[]>(empty);
  const [deadline, setDeadline] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [done, setDone] = useState(false);

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
      setDone(true);
    },
    onError: () => setOtp(empty()),
  });

  /** "متوجه شدم" on the success box: on to wherever the sign-in started. */
  function finish() {
    const next = loginSession.next();
    loginSession.clear();
    router.replace(next);
  }

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
    <>
      <PageTopBar fallbackHref="/login" />
      <div className="mx-auto w-full max-w-[440px] px-4 pb-10 pt-10 text-center lg:pt-8">
        <div aria-hidden className="text-[70px] leading-[1.25]">
          {SYMBOL.shield}
        </div>
        <h1 className="mt-3 text-[22px] font-black text-ink">تأیید شماره موبایل</h1>
        <p className="mt-2 text-[12px] leading-[2] text-muted">
          کد {toFaDigits(String(LENGTH))} رقمی ارسال‌شده به{" "}
          <span dir="ltr" className="tabular whitespace-nowrap">
            {mobile ? maskMobile(mobile) : "—"}
          </span>{" "}
          را وارد کنید.
        </p>

        <div className="mt-5">
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

        <div className="mt-4 text-[12px] text-muted" aria-live="polite">
          {left > 0 ? (
            <>
              ارسال مجدد کد در{" "}
              <span dir="ltr" className="tabular">
                {toFaDigits(formatClock(left))}
              </span>
            </>
          ) : (
            <button type="button" onClick={() => resend.mutate()} disabled={resend.isPending || !mobile} className="min-h-11 px-3 text-[13px] font-bold text-brand-500">
              ارسال مجدد کد
            </button>
          )}
        </div>
        <button type="button" onClick={() => router.push("/login")} className="mx-auto mt-1 flex min-h-11 items-center gap-1.5 px-3 text-[13px] text-ink">
          ویرایش شماره موبایل
          <Pencil className="size-3.5" />
        </button>

        <Button size="xl" block className="mt-3" onClick={() => submit(otp.join(""))} disabled={otp.some((d) => !d) && !verify.isPending} loading={verify.isPending}>
          تأیید و ورود
          {!verify.isPending && <ArrowLeft className="size-5" />}
        </Button>
      </div>

      {done && <StateDialog symbol={SYMBOL.success} title="شماره تأیید شد" message="اکنون می‌توانید وارد حساب خود شوید." onAction={finish} />}
      {error && (/منقضی/.test(error) ? (
        <StateDialog symbol={SYMBOL.wait} title="زمان اعتبار کد تمام شد" message="برای دریافت کد جدید اقدام کنید." onAction={() => verify.reset()} />
      ) : /صحیح نیست/.test(error) ? (
        <StateDialog symbol={SYMBOL.warning} title="کد واردشده صحیح نیست" message="لطفاً کد پیامک‌شده را دوباره بررسی کنید." actionLabel="تلاش مجدد" onAction={() => verify.reset()} />
      ) : (
        <StateDialog symbol={SYMBOL.warning} title="تأیید انجام نشد" message={error} actionLabel="تلاش مجدد" onAction={() => verify.reset()} />
      ))}
    </>
  );
}
