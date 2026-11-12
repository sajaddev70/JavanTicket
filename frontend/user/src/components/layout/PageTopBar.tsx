"use client";

import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/hooks/useContent";
import { AppLogo } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** Round glass button of the band top bars (back, share, favorite) — references 03–06. */
export function TopBarButton({ label, onClick, pressed, children, className }: { label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn("glass flex size-11 shrink-0 items-center justify-center rounded-full transition hover:bg-white/20", className)}
    >
      {children}
    </button>
  );
}

/**
 * Phone top bar of the detail / flow screens on the navy band: the white logo on the start side (or a large page
 * title, as on the seat / payment / ticket references) and the round back button with extra actions on the end side.
 * Replaced by the site header from `lg` up.
 */
export function PageTopBar({
  fallbackHref = "/",
  title,
  subtitle,
  actions,
  className,
}: {
  fallbackHref?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const settings = useSiteSettings().data;
  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };
  return (
    <div className={cn("pt-safe text-white lg:hidden", className)}>
      <div className="container-page flex h-[76px] items-center gap-3">
        {title ? (
          <h1 className="min-w-0 flex-1 truncate text-[22px] font-black">{title}</h1>
        ) : (
          <AppLogo siteName={settings?.site_name} shortName={settings?.short_name} />
        )}
        <div className={cn("flex items-center gap-2.5", !title && "mr-auto")}>
          {actions}
          <TopBarButton label="بازگشت" onClick={back}>
            <Icon name="common/chevron-left" className="size-6" />
          </TopBarButton>
        </div>
      </div>
      {subtitle && <p className="container-page -mt-1 pb-2 text-[13.5px] text-white/80">{subtitle}</p>}
    </div>
  );
}

/** Large white title on the band for list / account screens (references 08, 10, 11). */
export function BandTitle({ title, subtitle, actions, className }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-3 text-white", className)}>
      <div className="min-w-0">
        <h1 className="text-[24px] font-black leading-[1.5] sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] leading-6 text-white/80">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
