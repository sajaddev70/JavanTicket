'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, Loader2, LogIn, Pencil, Phone, RefreshCw } from 'lucide-react';
import { api, apiPost } from '@/services/api';
import { useUserAuthStore, type UserProfile } from '@/stores/useUserAuthStore';
import { AuthShell } from '@/components/auth/AuthShell';
import { OtpInput } from '@/components/auth/OtpInput';
import { maskMobile, toFaDigits } from '@/lib/format';
import { cn } from '@/lib/cn';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 120;
const emptyCode = () => Array<string>(OTP_LENGTH).fill('');
const noopSubscribe = () => () => {};

interface VerifyResponse {
  accessToken: string;
  user: UserProfile;
}

export default function UserVerifyPage() {
  const router = useRouter();
  const setAuth = useUserAuthStore((s) => s.setAuth);
  // undefined while rendering on the server; null when no login is pending.
  const mobile = useSyncExternalStore(noopSubscribe, () => sessionStorage.getItem('pending_user_mobile'), () => undefined);
  const [otp, setOtp] = useState<string[]>(emptyCode);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (mobile === null) router.replace('/login');
  }, [mobile, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const verify = useCallback(
    async (code: string) => {
      if (!mobile || verifying || code.length !== OTP_LENGTH) return;
      setError('');
      setNotice('');
      setVerifying(true);
      try {
        const data = await apiPost<VerifyResponse>('/auth/user/verify', { mobile, code });
        setAuth(data.user, data.accessToken);
        sessionStorage.removeItem('pending_user_mobile');
        const next = sessionStorage.getItem('login_next');
        sessionStorage.removeItem('login_next');
        router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
      } catch (err) {
        setError((err as { message?: string })?.message || 'کد تأیید واردشده صحیح نیست.');
        setOtp(emptyCode());
        setVerifying(false);
      }
    },
    [mobile, verifying, router, setAuth],
  );

  const resend = async () => {
    if (!mobile || secondsLeft > 0 || resending) return;
    setError('');
    setNotice('');
    setResending(true);
    try {
      await api.post('/auth/user/login', { mobile });
      setSecondsLeft(RESEND_SECONDS);
      setOtp(emptyCode());
      setNotice('کد تأیید جدید ارسال شد.');
    } catch (err) {
      setError((err as { message?: string })?.message || 'ارسال مجدد کد با خطا مواجه شد.');
    } finally {
      setResending(false);
    }
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <AuthShell>
      <h1 className="mt-6 text-center text-[26px] font-black text-ink sm:text-[30px]">تأیید شماره همراه</h1>
      <p className="mt-3 text-center text-[15px] text-muted">
        کد تأیید {toFaDigits(String(OTP_LENGTH))} رقمی به شماره زیر ارسال شد.
      </p>

      <div className="mx-auto mt-5 flex h-14 max-w-[340px] items-center justify-center gap-3 rounded-xl bg-surface-2 text-[18px] font-bold text-ink">
        <Phone className="size-5 text-ink/80" strokeWidth={1.8} />
        <span dir="ltr" className="tabular">
          {mobile ? maskMobile(mobile) : '—'}
        </span>
      </div>
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="flex min-h-11 items-center gap-2 px-2 text-[15px] font-semibold text-brand-600 hover:text-brand-700"
        >
          <Pencil className="size-[18px]" />
          ویرایش شماره
        </button>
      </div>

      <div className="mt-4">
        <OtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v);
            if (error) setError('');
          }}
          onComplete={verify}
          disabled={verifying}
          invalid={!!error}
        />
      </div>

      <div className="mt-4 min-h-6 text-center text-[14px]" aria-live="polite">
        {error && <p className="font-medium text-danger-fg">{error}</p>}
        {!error && notice && <p className="font-medium text-success-fg">{notice}</p>}
      </div>

      <div className="mt-1 flex items-center justify-center gap-3 text-[15px] text-muted">
        {secondsLeft > 0 ? (
          <>
            <Clock3 className="size-5 text-brand-600" />
            <span className="tabular font-bold text-brand-600" dir="ltr">
              {toFaDigits(`${minutes}:${seconds}`)}
            </span>
            <span>تا ارسال مجدد کد</span>
          </>
        ) : (
          <span>کد را دریافت نکردید؟</span>
        )}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <button
          type="button"
          onClick={resend}
          disabled={secondsLeft > 0 || resending}
          className={cn(
            'flex min-h-11 items-center gap-2 text-[15px] font-bold transition',
            secondsLeft > 0 ? 'cursor-not-allowed text-brand-600/45' : 'text-brand-600 hover:text-brand-700',
          )}
        >
          <RefreshCw className={cn('size-5', resending && 'animate-spin')} />
          ارسال مجدد کد
        </button>
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => verify(otp.join(''))}
        disabled={otp.some((d) => !d) || verifying}
        className="mt-6 flex h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-brand-600 text-[17px] font-bold text-white shadow-cta transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifying ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            در حال بررسی...
          </>
        ) : (
          <>
            تأیید و ورود
            <LogIn className="size-6 -scale-x-100" />
          </>
        )}
      </button>
    </AuthShell>
  );
}
