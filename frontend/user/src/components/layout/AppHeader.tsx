"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation, useSiteSettings } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { AppLogo } from "@/components/ui/BrandMark";
import { SmartLink } from "@/components/ui/SmartLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CitySelector } from "./CitySelector";
import { SearchField } from "./SearchField";
import { UserMenu } from "./UserMenu";
import { BrandRow } from "./PageTopBar";
import { hasOwnTopBar } from "./chrome";

function isActive(pathname: string, url: string) {
  const path = url.split("?")[0];
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Compact header of the redesign: logo, city and account on phones (search underneath on browse screens);
 * on desktop the same row also carries the admin-managed menu and the search field.
 */
export function AppHeader() {
  const pathname = usePathname();
  const nav = useNavigation();
  const settings = useSiteSettings().data;
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const next = pathname === "/login" || pathname === "/verify" ? "" : `?next=${encodeURIComponent(pathname)}`;
  const firstName = user?.fullName?.trim().split(/\s+/)[0];

  return (
    <header className={cn("lg:sticky lg:top-0 lg:z-40 lg:border-b lg:border-line lg:bg-surface-solid/95 lg:backdrop-blur", hasOwnTopBar(pathname) && "hidden lg:block")}>
      <div className="container-page pt-safe">
        {/* Phones: the design's brand row and large title (home only; other screens have their own header) */}
        <div className="pt-2 lg:hidden">
          <BrandRow>
            <CitySelector />
            <Link
              href={user ? "/profile" : `/login${next}`}
              aria-label={hydrated && user ? (firstName ?? "پروفایل") : "ورود / ثبت‌نام"}
              className="flex size-10 shrink-0 items-center justify-center rounded-[15px] border border-line bg-field text-ink"
            >
              <Icon name="common/profile" className="size-5" />
            </Link>
          </BrandRow>
          <h1 className="mt-2.5 text-[24px] font-black leading-[1.4] text-ink">خانه</h1>
          {settings?.site_name && <p className="text-[12px] leading-[1.8] text-muted">{settings.site_name}</p>}
        </div>
        <div className="hidden h-[76px] items-center gap-6 lg:flex">
          <AppLogo siteName={settings?.site_name} shortName={settings?.short_name} />

          <nav aria-label="منوی اصلی" className="hidden h-full items-center gap-6 xl:flex">
            {nav.isLoading
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-4 w-14" />)
              : nav.data?.header.map((item) => {
                  const active = isActive(pathname, item.url);
                  return (
                    <SmartLink
                      key={item.id}
                      link={item}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-full items-center text-[14px] font-bold transition-colors",
                        active ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-chip" : "text-ink-2 hover:text-ink",
                      )}
                    />
                  );
                })}
          </nav>

          <SearchField className="hidden flex-1 lg:block lg:max-w-[420px] xl:mr-auto" />

          <div className="mr-auto flex items-center gap-2.5 lg:mr-0">
            <CitySelector />
            <ThemeToggle />
            <div>
              {!hydrated ? (
                <Skeleton className="h-11 w-[120px] rounded-xl" />
              ) : user ? (
                <UserMenu />
              ) : (
                <ButtonLink href={`/login${next}`} size="sm" className="min-h-11 px-5 shadow-none">
                  <Icon name="common/profile" className="size-[18px]" />
                  ورود / ثبت‌نام
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
