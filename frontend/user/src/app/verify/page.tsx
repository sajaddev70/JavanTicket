'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Edit2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { useUserAuthStore } from '@/stores/useUserAuthStore';

export default function UserVerifyPage() {
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
  const setAuth = useUserAuthStore((state: any) => state.setAuth);

  useEffect(() => {
    const pendingMobile = localStorage.getItem('pending_user_mobile');
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

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

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
      const res: any = await api.post('/auth/user/verify', {
        mobile,
        code,
      });

      if (res?.data) {
        setAuth(res.data.user, res.data.accessToken);
        localStorage.removeItem('pending_user_mobile');
        router.replace('/');
      }
    } catch (err: any) {
      setError(err?.message || 'کد تأیید واردشده صحیح نیست.');
      setOtp(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">تأیید کد ورود</h1>
          <p className="text-slate-400 text-sm dir-ltr font-mono">{mobile}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
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
                className="w-14 h-16 text-center bg-slate-950 border border-slate-800 focus:border-blue-500 text-white rounded-xl text-2xl font-mono focus:outline-none"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            onClick={() => verifyCode(otp.join(''))}
            disabled={loading || otp.some((d) => !d)}
            className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>تأیید و ادامه</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
