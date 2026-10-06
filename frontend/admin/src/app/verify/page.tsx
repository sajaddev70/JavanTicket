'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Edit2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

export default function AdminVerifyPage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const router = useRouter();
  const setAuth = useAdminAuthStore((state: any) => state.setAuth);

  useEffect(() => {
    const pendingMobile = localStorage.getItem('pending_admin_mobile');
    if (!pendingMobile) {
      router.replace('/login');
      return;
    }
    setMobile(pendingMobile);

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto next
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto submit if complete
    if (newOtp.every((digit) => digit !== '') && value) {
      verifyCode(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs[3].current?.focus();
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      const res: any = await api.post('/auth/admin/verify', {
        mobile,
        code,
      });

      if (res?.data) {
        setAuth(res.data.user, res.data.accessToken);
        localStorage.removeItem('pending_admin_mobile');
        router.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'کد تأیید واردشده صحیح نیست.');
      setOtp(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setTimer(120);
    try {
      await api.post('/auth/admin/login', { mobile });
    } catch (err: any) {
      setError(err?.message || 'خطا در ارسال مجدد کد.');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">تأیید کد ورود</h1>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm dir-ltr">
            <span className="font-mono text-slate-200">{mobile}</span>
            <button
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:text-blue-300 p-1"
              title="ویرایش شماره"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex justify-center gap-3 dir-ltr" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-16 text-center bg-slate-900 border border-slate-700 focus:border-blue-500 text-white rounded-xl text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            onClick={() => verifyCode(otp.join(''))}
            disabled={loading || otp.some((d) => !d)}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>تأیید و ورود</span>}
          </button>

          <div className="flex items-center justify-between text-sm border-t border-slate-700/60 pt-4">
            <button
              onClick={() => router.push('/login')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              تغییر شماره
            </button>

            {timer > 0 ? (
              <span className="text-slate-400 font-mono">
                ارسال مجدد ({formatTimer(timer)})
              </span>
            ) : (
              <button
                onClick={handleResend}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ارسال مجدد کد</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
