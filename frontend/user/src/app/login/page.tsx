'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Send, UserRound } from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { useUserAuthStore } from '@/stores/useUserAuthStore';
import { normalizeIranMobile } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Where to go after signing in: ?next=/internal/path only (never another site). */
function safeNext(): string {
  if (typeof window === 'undefined') return '/';
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export default function UserLoginPage() {
  const router = useRouter();
  const token = useUserAuthStore((s) => s.token);
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) router.replace(safeNext());
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const normalized = normalizeIranMobile(mobile);
    if (!normalized) {
      setError('شماره تلفن همراه معتبر نیست. نمونه: ۰۹۱۲۳۴۵۶۷۸۹');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/user/login', { mobile: normalized });
      sessionStorage.setItem('pending_user_mobile', normalized);
      sessionStorage.setItem('login_next', safeNext());
      router.push('/verify');
    } catch (err) {
      setError((err as { message?: string })?.message || 'ارسال کد تأیید با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="mt-6 text-center text-[26px] font-black text-ink sm:text-[30px]">ورود / ثبت‌نام</h1>
      <p className="mx-auto mt-3 max-w-[400px] text-center text-[15px] leading-7 text-muted">
        برای خرید بلیت و مشاهده سفارش‌ها، شماره تلفن همراه خود را وارد کنید.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7">
        <label htmlFor="mobile" className="mb-3 flex items-center gap-2 text-[15px] font-medium text-ink">
          <UserRound className="size-5 text-ink/80" strokeWidth={1.8} />
          شماره تلفن همراه
        </label>
        <div
          className={cn(
            'flex h-[58px] items-stretch overflow-hidden rounded-xl border bg-surface transition focus-within:ring-4',
            error ? 'border-danger/60 focus-within:ring-danger/10' : 'border-line-strong focus-within:border-brand-500/60 focus-within:ring-brand-500/10',
          )}
        >
          <span className="flex shrink-0 items-center border-l border-line px-4 text-[16px] font-bold text-ink" dir="ltr">
            +۹۸
          </span>
          <input
            id="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            dir="ltr"
            placeholder="۰۹۱۲ xxx xxxx"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
              if (error) setError('');
            }}
            maxLength={16}
            aria-invalid={!!error}
            aria-describedby={error ? 'mobile-error' : undefined}
            className="tabular min-w-0 flex-1 bg-transparent px-4 text-left text-[17px] tracking-wide text-ink outline-none placeholder:text-muted/70"
            autoFocus
          />
        </div>
        {error && (
          <p id="mobile-error" role="alert" className="mt-2 text-[13px] font-medium text-danger-fg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-brand-600 text-[17px] font-bold text-white shadow-cta transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              در حال ارسال کد...
            </>
          ) : (
            <>
              <Send className="size-5 -scale-x-100" />
              دریافت کد تأیید
            </>
          )}
        </button>
      </form>

      <div className="mt-5 flex items-start gap-3 rounded-xl bg-surface-2 px-4 py-3.5 text-[14px] leading-7 text-ink/80">
        <Lock className="mt-1 size-5 shrink-0 text-ink/70" strokeWidth={1.8} />
        <p>اگر حساب کاربری ندارید، با اولین ورود به‌صورت خودکار ساخته می‌شود.</p>
      </div>

      <div className="mt-7 border-t border-line pt-6 text-center">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-brand-600 hover:text-brand-700">
          <ArrowRight className="size-5" />
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </AuthShell>
  );
}
