'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, CircleHelp, ExternalLink, Loader2, Lock, Send, UserRound } from 'lucide-react';
import { api } from '@/services/api';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { FloatingThemeToggle } from '@/components/ui/FloatingThemeToggle';
import { LoginIllustration } from '@/components/auth/LoginIllustration';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';
import { normalizeIranMobile } from '@/lib/format';
import { cn } from '@/lib/cn';

const USER_SITE_URL = process.env.NEXT_PUBLIC_USER_SITE_URL || '/';

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: settings } = useSiteSettings();
  const hydrated = useAdminAuthStore((s) => s.hydrated);
  const token = useAdminAuthStore((s) => s.token);

  useEffect(() => {
    if (hydrated && token) router.replace('/dashboard');
  }, [hydrated, token, router]);

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
      await api.post('/auth/admin/login', { mobile: normalized });
      sessionStorage.setItem('pending_admin_mobile', normalized);
      router.push('/verify');
    } catch (err) {
      setError((err as { message?: string })?.message || 'ارسال کد تأیید با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  const helpHref = settings?.contact_phone
    ? `tel:${settings.contact_phone.replace(/[^\d+]/g, '')}`
    : settings?.contact_email
      ? `mailto:${settings.contact_email}`
      : undefined;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page">
      <AuthBackground />
      <FloatingThemeToggle />

      <main className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 items-center gap-10 px-4 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 lg:px-14 lg:pt-14">
        <div className="mx-auto w-full max-w-[640px] rounded-[22px] border border-line/60 bg-surface px-6 py-9 shadow-[0_20px_60px_rgb(30_70_140_/_0.10)] sm:px-11 sm:py-12">
          <div className="flex justify-center">
            <BrandLogo width={200} className="h-auto w-[150px] sm:w-[200px]" />
          </div>

          <h1 className="mt-6 text-center text-[28px] font-black text-ink sm:text-[38px]">ورود به پنل مدیریت</h1>
          <p className="mx-auto mt-4 max-w-[520px] text-center text-[15px] leading-8 text-muted sm:text-[17px]">
            برای دسترسی به قابلیت‌های مدیریت رویدادها، فروش، گزارش‌ها و سایر امکانات، وارد حساب مدیریتی خود شوید.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8">
            <label htmlFor="mobile" className="mb-3 flex items-center gap-2 text-[15px] font-medium text-ink">
              <UserRound className="size-5 text-ink/80" strokeWidth={1.8} />
              شماره تلفن همراه
            </label>

            <div
              className={cn(
                'flex h-[62px] items-stretch overflow-hidden rounded-xl border bg-surface transition focus-within:ring-4',
                error
                  ? 'border-danger/60 focus-within:ring-danger/10'
                  : 'border-line-strong focus-within:border-brand-500/60 focus-within:ring-brand-500/10',
              )}
            >
              <span className="flex shrink-0 items-center gap-2 border-l border-line px-5 text-[17px] font-bold text-ink" dir="ltr">
                <ChevronDown className="size-4 text-ink/70" />
                <span>+۹۸</span>
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
                className="tabular min-w-0 flex-1 bg-transparent px-5 text-left text-[18px] tracking-wide text-ink outline-none placeholder:text-muted/70"
                autoFocus
              />
            </div>
            {error && (
              <p id="mobile-error" role="alert" className="mt-2 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex h-[62px] w-full items-center justify-center gap-3 rounded-xl bg-brand-600 text-[18px] font-bold text-white shadow-cta transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
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

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-surface-2 px-5 py-4 text-[14px] leading-7 text-ink/80 sm:text-[15px]">
            <Lock className="mt-1 size-5 shrink-0 text-ink/70" strokeWidth={1.8} />
            <p>فقط شماره‌های ثبت‌شده به عنوان مدیر امکان ورود به پنل مدیریت را دارند.</p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 border-t border-line pt-7 text-[15px] font-medium text-brand-600 sm:gap-12">
            <a href={helpHref} className={cn('flex items-center gap-2 hover:text-brand-700', !helpHref && 'pointer-events-none opacity-60')}>
              <CircleHelp className="size-5" />
              نیاز به کمک دارید؟
            </a>
            <span className="h-6 w-px bg-line" />
            <a href={USER_SITE_URL} className="flex items-center gap-2 hover:text-brand-700">
              بازگشت به سایت
              <ExternalLink className="size-5" />
            </a>
          </div>
        </div>

        <LoginIllustration />
      </main>

      <AuthFooter />
    </div>
  );
}
