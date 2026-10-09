import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { FloatingThemeToggle } from "@/components/ui/FloatingThemeToggle";

/** Centered card layout shared by the user login and OTP pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface-2">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-brand-500/12 blur-3xl" />
        <div className="absolute -bottom-48 -right-24 size-[480px] rounded-full bg-ticket/8 blur-3xl" />
      </div>
      <FloatingThemeToggle />
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[520px] rounded-[22px] border border-line/60 bg-surface px-5 py-9 shadow-float sm:px-10 sm:py-10">
          <div className="flex justify-center">
            <Link href="/" aria-label="صفحه اصلی">
              <BrandLogo width={130} className="h-auto w-[104px] sm:w-[130px]" />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
