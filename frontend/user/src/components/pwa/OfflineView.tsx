'use client';

import { RefreshCw, WifiOff } from "lucide-react";
import { FloatingThemeToggle } from "@/components/ui/FloatingThemeToggle";

/** Served by the service worker when a page is requested without a network connection. */
export function OfflineView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-2 px-4 text-center">
      <FloatingThemeToggle />
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <WifiOff className="size-8" />
      </span>
      <h1 className="text-[22px] font-black text-ink sm:text-[26px]">اتصال به اینترنت برقرار نیست</h1>
      <p className="max-w-sm text-[15px] leading-8 text-muted">لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 text-[15px] font-bold text-white shadow-cta hover:bg-brand-700"
      >
        <RefreshCw className="size-5" />
        تلاش مجدد
      </button>
    </div>
  );
}
