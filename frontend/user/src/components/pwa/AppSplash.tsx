"use client";

import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useContent";
import { BrandMark } from "@/components/ui/BrandMark";
import { LoadingOverlay, StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { SPLASH_SEEN_KEY } from "@/lib/theme";

const MIN_MS = 1200;
const SLOW_MS = 1500;

/**
 * 01 صفحه آغازین: عادی، بارگذاری، خطای اتصال. On phones only, once per visit, until the site settings have answered.
 * The page itself is rendered underneath, so search engines and links get the real content.
 */
export function AppSplash() {
  const settings = useSiteSettings();
  const [minPassed, setMinPassed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const min = setTimeout(() => setMinPassed(true), MIN_MS);
    const late = setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(late);
    };
  }, []);

  useEffect(() => {
    if (!minPassed || !settings.data) return;
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // Storage unavailable: the splash just shows again on the next load.
    }
    document.documentElement.setAttribute("data-splash-seen", "");
    // Runs after the timer effect, when the answer arrives; hiding the splash is the point of this external update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(true);
  }, [minPassed, settings.data]);

  if (done) return null;
  return (
    <div className="app-splash fixed inset-0 z-[70] overflow-hidden px-[19px] lg:hidden" style={{ background: "linear-gradient(160deg,#071538,#0e1851 65%,#140e47)" }} data-print-hidden>
      <div className="mx-auto flex max-w-[420px] flex-col items-center pt-[calc(120px+env(safe-area-inset-top))] text-center">
        <BrandMark className="w-[155px] !text-[#8ed4ff]" />
        <p className="mt-3 text-[36px] font-black leading-[1.5] text-white">جوان</p>
        <p className="text-[12px] leading-[2] text-[#b9c8e7]">سامانه رزرو و خرید بلیت رویدادها</p>
        <div className="bg-hero mt-14 min-h-[200px] w-full rounded-[23px] p-[18px] text-white">
          <strong className="text-[20px] font-black leading-[1.8]">دنیایی از تجربه‌های تازه</strong>
          <small className="mt-2 block text-[11px]">همایش‌ها • نمایشگاه‌ها • کنسرت‌ها</small>
        </div>
      </div>
      {settings.isError && !settings.data ? (
        <StateDialog symbol={SYMBOL.warning} title="ارتباط برقرار نشد" message="اتصال اینترنت را بررسی و دوباره تلاش کنید." actionLabel="تلاش مجدد" onAction={() => settings.refetch()} />
      ) : (
        slow && <LoadingOverlay title="در حال بارگذاری" message="لطفاً چند لحظه منتظر بمانید." />
      )}
    </div>
  );
}
