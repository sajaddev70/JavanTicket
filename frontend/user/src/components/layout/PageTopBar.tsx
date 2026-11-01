"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/hooks/useContent";
import { BrandMark } from "@/components/ui/BrandMark";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** The design's .round: small glass button of the header row (back, favorite, share). */
export function TopBarButton({ label, onClick, pressed, children, className }: { label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-[15px] border border-line bg-field text-ink transition hover:bg-brand-50", className)}
    >
      {children}
    </button>
  );
}

/** The design's .top row: the mark and short site name on the start side, [children] on the end side. */
export function BrandRow({ children, className }: { children?: React.ReactNode; className?: string }) {
  const settings = useSiteSettings().data;
  const name = settings?.short_name?.trim() || settings?.site_name?.trim() || "";
  return (
    <div className={cn("flex min-h-11 items-center gap-2", className)}>
      <Link href="/" aria-label={settings?.site_name ? `${settings.site_name} - صفحه اصلی` : "صفحه اصلی"} className="flex min-h-11 items-center gap-2">
        <BrandMark className="w-[45px]" />
        <span className="text-[16px] font-black text-ink">{name}</span>
      </Link>
      {children && <div className="mr-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}

/**
 * Header of every screen in the design: brand row with the back button at the far end (phones; the site header takes
 * its place from `lg` up), then the large title and the site name under it.
 */
export function PageTopBar({
  fallbackHref = "/",
  title,
  subtitle,
  noBack,
  onBack,
  actions,
  className,
}: {
  fallbackHref?: string;
  title?: string;
  /** Line under the title; defaults to the site name. */
  subtitle?: string;
  noBack?: boolean;
  /** Back inside the same screen (sub-pages of the profile); otherwise the browser history. */
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const settings = useSiteSettings().data;
  const back = () => {
    if (onBack) onBack();
    else if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };
  return (
    <div className={cn("container-page pt-safe", className)} data-print-hidden>
      <BrandRow className="pt-2 lg:hidden">
        {actions}
        {!noBack && (
          <TopBarButton label="بازگشت" onClick={back}>
            <Icon name="common/chevron-left" className="size-[18px]" />
          </TopBarButton>
        )}
      </BrandRow>
      {title && (
        <div className="mt-2.5 flex items-center gap-3 lg:mt-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-black leading-[1.4] text-ink lg:text-[28px]">{title}</h1>
            <p className="text-[12px] leading-[1.8] text-muted">{subtitle ?? settings?.site_name}</p>
          </div>
          {actions && <div className="hidden items-center gap-2 lg:flex">{actions}</div>}
        </div>
      )}
    </div>
  );
}
