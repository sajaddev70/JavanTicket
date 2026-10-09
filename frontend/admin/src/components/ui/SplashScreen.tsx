import { BrandLogo } from "./BrandLogo";

/** Shown while the stored session is read and the user is routed to the right page. */
export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-page px-4" aria-busy="true" aria-live="polite">
      <BrandLogo width={150} className="h-auto w-[120px] sm:w-[150px]" />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/3 animate-[indeterminate_1.2s_infinite_ease-in-out] rounded-full bg-brand-600" />
      </div>
      <p className="text-sm text-muted">در حال آماده‌سازی پنل مدیریت...</p>
    </div>
  );
}
