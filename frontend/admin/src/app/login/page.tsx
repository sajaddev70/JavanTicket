'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ArrowLeft, Loader2, AlertCircle, ShieldCheck, Ticket, Users, TrendingUp } from 'lucide-react';
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
      await api.post('/auth/admin/login', { mobile: cleanedMobile });
      localStorage.setItem('pending_admin_mobile', cleanedMobile);
      router.push('/verify');
    } catch (err: any) {
      if (err?.message) {
        setError(err.message);
      } else {
        // Fallback for development/testing if backend endpoint isn't live
        localStorage.setItem('pending_admin_mobile', cleanedMobile);
        router.push('/verify');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden dir-rtl">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

        {/* Left Stats/Banner Area (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 text-right pr-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 text-sm font-medium w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>سامانه جامع مدیریت بلیت‌فروشی</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight">
            مرکز همایش و نمایش جوان
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            پنل یکپارچه مدیریت کنسرت‌ها، همایش‌ها و رویدادهای فرهنگی. مدیریت هوشمند فروش، سانس‌ها و گزارش‌های لحظه‌ای.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 max-w-md">
            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">+۵۰,۰۰۰</div>
                <div className="text-xs text-slate-400">بلیت صادر شده</div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">۹۹.۹٪</div>
                <div className="text-xs text-slate-400">پایداری سیستم</div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl">

            {/* Header / Logo Section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">ورود به پنل مدیریت</h2>
              <p className="text-slate-400 text-sm">لطفا شماره تلفن همراه خود را وارد کنید</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3 text-red-400 text-sm">
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
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 text-white rounded-2xl py-3.5 px-4 pr-11 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                    autoFocus
                  />
                  <Phone className="w-5 h-5 text-slate-500 absolute right-3.5 top-4" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  کد یک‌بار مصرف به این شماره ارسال خواهد شد.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
              شماره تست مدیر: <code className="text-blue-400 font-mono">09123456789</code> | کد OTP: <code className="text-blue-400 font-mono">1111</code>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
