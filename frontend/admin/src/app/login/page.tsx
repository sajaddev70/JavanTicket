'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Phone, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanedMobile = mobile.trim();
    if (!/^09\d{9}$/.test(cleanedMobile)) {
      setError('شماره تلفن همراه وارد شده معتبر نیست. (نمونه: 09123456789)');
      return;
    }

    setLoading(true);

    try {
      // Call Backend API
      await api.post('/auth/admin/login', { mobile: cleanedMobile });
      localStorage.setItem('pending_admin_mobile', cleanedMobile);
      router.push('/verify');
    } catch (err: any) {
      if (err?.message) {
        setError(err.message);
      } else {
        setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ورود به پنل مدیریت</h1>
          <p className="text-slate-400 text-sm">سامانه مدیریت رویدادها و بلیت‌فروشی جوانان</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              شماره تلفن همراه
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                placeholder="09123456789"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={11}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-xl py-3 px-4 pl-11 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                autoFocus
              />
              <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              جهت ورود، کد یک‌بار مصرف به این شماره ارسال خواهد شد.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>دریافت کد تأیید</span>
                <ArrowLeft className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/60 text-center text-xs text-slate-500">
          نسخه تست توسعه: مدیر پیش‌فرض <code className="text-blue-400">09123456789</code> | کد OTP: <code className="text-blue-400">1111</code>
        </div>
      </div>
    </div>
  );
}
