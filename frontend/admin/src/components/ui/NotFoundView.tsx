'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, House, Ticket } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { FloatingThemeToggle } from "./FloatingThemeToggle";
import { AuthBackground } from "@/components/auth/AuthBackground";

/** Designed 404 for the admin panel: Persian copy, responsive, theme-aware. */
export function NotFoundView() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page">
      <AuthBackground />
      <FloatingThemeToggle />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-[560px] text-center">
          <div className="flex justify-center">
            <BrandLogo width={130} className="h-auto w-[104px] sm:w-[130px]" />
          </div>

          {/* Ticket stub with the error code; the notches are cut with radial gradients. */}
          <div
            className="relative mx-auto mt-8 flex max-w-[420px] items-center justify-center gap-3 rounded-3xl bg-gradient-to-l from-brand-600 to-brand-500 px-6 py-6 text-white shadow-[0_24px_60px_rgb(26_110_232_/_0.35)] sm:py-8"
            style={{
              WebkitMask:
                "radial-gradient(circle 18px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 18px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat",
              mask: "radial-gradient(circle 18px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 18px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat",
            }}
          >
            <Ticket className="size-10 shrink-0 -rotate-45 opacity-90 sm:size-14" strokeWidth={1.6} />
            <span className="text-[76px] font-black leading-none tracking-wider sm:text-[110px]" dir="ltr">
              ۴۰۴
            </span>
            <span className="absolute inset-y-5 left-[22%] border-l-2 border-dashed border-white/35" aria-hidden />
          </div>

          <h1 className="mt-9 text-[24px] font-black text-ink sm:text-[30px]">صفحه موردنظر پیدا نشد</h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-8 text-muted">
            ممکن است آدرس را اشتباه وارد کرده باشید، یا این صفحه جابه‌جا یا حذف شده باشد.
          </p>

          <div className="mt-8 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-6 text-[15px] font-bold text-ink transition hover:border-brand-500/40"
            >
              <ArrowRight className="size-5" />
              صفحه قبل
            </button>
            <Link
              href="/dashboard"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-[15px] font-bold text-white shadow-cta transition hover:bg-brand-700"
            >
              <House className="size-5" />
              بازگشت به داشبورد
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
