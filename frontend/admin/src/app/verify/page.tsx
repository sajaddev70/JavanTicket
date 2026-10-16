'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock3, Loader2, LogIn, Pencil, Phone, RefreshCw } from 'lucide-react';
import { api, apiPost } from '@/services/api';
import { useAdminAuthStore, type AdminUser } from '@/stores/useAdminAuthStore';
import { OtpInput } from '@/components/auth/OtpInput';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { FloatingThemeToggle } from '@/components/ui/FloatingThemeToggle';
import { asset } from '@/lib/assets';
import { maskMobile, toFaDigits } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useSessionValue } from '@/hooks/useIsClient';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 120;

interface VerifyResponse {
  accessToken: string;
  refreshToken?: string;
  user: AdminUser;
}

const emptyCode = () => Array<string>(OTP_LENGTH).fill('');

export default function AdminVerifyPage() {
  const router = useRouter();
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  const mobile = useSessionValue('pending_admin_mobile');
  const [otp, setOtp] = useState<string[]>(emptyCode);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    // undefined = not read yet (SSR); null = nothing pending, so start over from the login step.
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
        const data = await apiPost<VerifyResponse>('/auth/admin/verify', { mobile, code });
        setAuth({ ...data.user, roles: [...(data.user.roles ?? [])], permissions: [...(data.user.permissions ?? [])] }, data.accessToken);
        sessionStorage.removeItem('pending_admin_mobile');
        router.replace('/dashboard');
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
      await api.post('/auth/admin/login', { mobile });
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
  const complete = otp.every((d) => d !== '');

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page">
      <AuthBackground />
      <FloatingThemeToggle />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[616px] rounded-[22px] border border-line/60 bg-surface px-5 py-9 shadow-[0_20px_60px_rgb(30_70_140_/_0.10)] sm:px-11 sm:py-10">
          <div className="flex justify-center">
            <Image
              src={asset('/assets/auth/otp-phone.png')}
              alt=""
              width={184}
              height={185}
              preload
              className="size-36 sm:size-[184px]"
            />
          </div>

          <h1 className="mt-4 text-center text-[26px] font-black text-ink sm:text-[32px]">تأیید شماره همراه</h1>
          <p className="mt-3 text-center text-[15px] text-muted sm:text-[17px]">
            کد تأیید {toFaDigits(String(OTP_LENGTH))} رقمی به شماره زیر ارسال شد.
          </p>

          <div className="mx-auto mt-6 flex h-16 max-w-[402px] items-center justify-center gap-4 rounded-xl bg-surface-2 text-[20px] font-bold text-ink">
            <Phone className="size-6 text-ink/80" strokeWidth={1.8} />
            <span dir="ltr" className="tabular">
              {mobile ? maskMobile(mobile) : '—'}
            </span>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex min-h-11 items-center gap-2 px-2 text-[16px] font-semibold text-brand-600 hover:text-brand-700"
            >
              <Pencil className="size-[18px]" />
              ویرایش شماره
            </button>
          </div>

          <div className="mt-5">
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
            {error && <p className="font-medium text-danger">{error}</p>}
            {!error && notice && <p className="font-medium text-success">{notice}</p>}
          </div>

          <div className="mt-2 flex items-center justify-center gap-3 text-[16px] text-muted">
            {secondsLeft > 0 ? (
              <>
                <Clock3 className="size-6 text-brand-600" strokeWidth={2} />
                <span className="tabular font-bold text-brand-600" dir="ltr">
                  {toFaDigits(`${minutes}:${seconds}`)}
                </span>
                <span>تا ارسال مجدد کد</span>
              </>
            ) : (
              <span>کد را دریافت نکردید؟</span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <button
              type="button"
              onClick={resend}
              disabled={secondsLeft > 0 || resending}
              className={cn(
                'flex min-h-11 items-center gap-2 text-[16px] font-bold transition',
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
            disabled={!complete || verifying}
            className="mt-7 flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-brand-600 text-[19px] font-bold text-white shadow-cta transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
