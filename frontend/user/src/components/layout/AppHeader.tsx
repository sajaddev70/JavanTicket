"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation, useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { AppLogo } from "@/components/ui/BrandMark";
import { SmartLink } from "@/components/ui/SmartLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CitySelector } from "./CitySelector";
import { SearchField } from "./SearchField";
import { UserMenu } from "./UserMenu";
import { hasOwnTopBar, showsHeaderSearch } from "./chrome";

function isActive(pathname: string, url: string) {
  const path = url.split("?")[0];
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

/** Round translucent button of the band header (search, account) — reference 01. */
export function BandIconLink({ href, label, children, className }: { href: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} aria-label={label} title={label} className={cn("glass flex size-11 shrink-0 items-center justify-center rounded-full transition hover:bg-white/20", className)}>
      {children}
    </Link>
  );
}

/**
 * Header on the navy band (references 01, 02): the white logo on the start side, round glass buttons on the end side;
 * on desktop the same row also carries the admin-managed menu, the search field, city, theme and account.
 */
export function AppHeader() {
  const pathname = usePathname();
  const nav = useNavigation();
  const settings = useSiteSettings().data;
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const next = pathname === "/login" || pathname === "/verify" ? "" : `?next=${encodeURIComponent(pathname)}`;

  return (
    <header
      className={cn(
        "text-white lg:sticky lg:top-0 lg:z-40 lg:border-b lg:border-white/10 lg:bg-navy-900/80 lg:backdrop-blur-xl",
        hasOwnTopBar(pathname) && "hidden lg:block",
      )}
    >
      <div className="container-page pt-safe">
        <div className="flex h-[76px] items-center gap-2 min-[400px]:gap-3 lg:h-[78px] lg:gap-6">
          <AppLogo siteName={settings?.site_name} shortName={settings?.short_name} />

          <nav aria-label="منوی اصلی" className="hidden h-full items-center gap-6 xl:flex">
            {nav.isLoading
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-4 w-14 bg-white/15" />)
              : nav.data?.header.map((item) => {
                  const active = isActive(pathname, item.url);
                  return (
                    <SmartLink
                      key={item.id}
                      link={item}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-full items-center text-[14px] font-bold transition-colors",
                        active
                          ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-grad-primary"
                          : "text-white/75 hover:text-white",
                      )}
                    />
                  );
                })}
          </nav>

          <SearchField onBand className="hidden flex-1 lg:block lg:max-w-[420px] xl:mr-auto" />

          <div className="mr-auto flex items-center gap-2 min-[400px]:gap-2.5 lg:mr-0">
            <CitySelector />
            <ThemeToggle onBand className="hidden lg:flex" />
            <div className="hidden lg:block">
              {!hydrated ? (
                <Skeleton className="h-11 w-[120px] rounded-full bg-white/15" />
              ) : user ? (
                <UserMenu />
              ) : (
                <Link href={`/login${next}`} className="bg-grad-primary glow-primary flex min-h-11 items-center gap-2 rounded-full px-5 text-[13.5px] font-bold text-white">
                  <Icon name="common/profile" className="size-[18px]" />
                  ورود / ثبت‌نام
                </Link>
              )}
            </div>
            {/* Phones: a round glass search button (reference 01); the account lives in the bottom navigation */}
            {!showsHeaderSearch(pathname) && (
              <BandIconLink href="/events" label="جستجو در رویدادها" className="lg:hidden">
                <Icon name="common/search" className="size-[21px]" />
              </BandIconLink>
            )}
          </div>
        </div>
        {showsHeaderSearch(pathname) && <SearchField onBand className="pb-3 lg:hidden" />}
      </div>
    </header>
  );
}
