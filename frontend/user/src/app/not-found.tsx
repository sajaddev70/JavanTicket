import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, House, Ticket } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
};

const TICKET_MASK =
  "radial-gradient(circle 18px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 18px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-[560px] text-center">
          {/* Ticket stub with the error code; the notches are cut with radial-gradient masks. */}
          <div
            className="relative mx-auto flex max-w-[420px] items-center justify-center gap-3 rounded-3xl bg-gradient-to-l from-ticket to-[#ff4d6d] px-6 py-6 text-white shadow-[0_24px_60px_rgb(232_20_63_/_0.3)] sm:py-8"
            style={{ WebkitMask: TICKET_MASK, mask: TICKET_MASK }}
          >
            <Ticket className="size-10 shrink-0 -rotate-45 opacity-90 sm:size-14" strokeWidth={1.6} />
            <span className="text-[76px] font-black leading-none tracking-wider sm:text-[110px]" dir="ltr">
              ۴۰۴
            </span>
            <span className="absolute inset-y-5 left-[22%] border-l-2 border-dashed border-white/40" aria-hidden />
          </div>

          <h1 className="mt-9 text-[24px] font-black text-ink sm:text-[30px]">این صفحه پیدا نشد</h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-8 text-muted">
            شاید آدرس اشتباه وارد شده یا این صفحه دیگر در دسترس نیست. از صفحه اصلی یا فهرست رویدادها ادامه دهید.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-[15px] font-bold text-white shadow-cta hover:bg-brand-700"
            >
              <House className="size-5" />
              صفحه اصلی
            </Link>
            <Link
              href="/events"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-6 text-[15px] font-bold text-ink hover:border-brand-500/40"
            >
              <CalendarDays className="size-5" />
              مشاهده رویدادها
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
