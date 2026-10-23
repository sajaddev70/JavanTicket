"use client";

import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/hooks/useContent";
import { AppLogo } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** Square soft button of the top bars (back, favorite, share). */
export function TopBarButton({ label, onClick, pressed, children, className }: { label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-field text-ink transition hover:bg-brand-50 hover:text-brand-600", className)}
    >
      {children}
    </button>
  );
}

/**
 * Phone top bar of the detail / flow screens (event, seats, OTP, ticket): logo on the start side, an optional title,
 * extra actions and the back button on the end side. Replaced by the site header from `lg` up.
 */
export function PageTopBar({ fallbackHref = "/", title, actions, className }: { fallbackHref?: string; title?: string; actions?: React.ReactNode; className?: string }) {
  const router = useRouter();
  const settings = useSiteSettings().data;
  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };
  return (
    <div className={cn("bg-surface pt-safe lg:hidden", className)}>
      <div className="container-page flex h-[72px] items-center gap-3">
        <AppLogo siteName={settings?.site_name} shortName={settings?.short_name} />
        {title && <p className="flex-1 truncate text-center text-[17px] font-black text-ink">{title}</p>}
        <div className={cn("flex items-center gap-2.5", !title && "mr-auto")}>
          {actions}
          <TopBarButton label="بازگشت" onClick={back}>
            <Icon name="common/chevron-left" className="size-6" />
          </TopBarButton>
        </div>
      </div>
    </div>
  );
}
