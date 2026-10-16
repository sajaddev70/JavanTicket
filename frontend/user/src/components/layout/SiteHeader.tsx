"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, Menu, UserPlus, UserRound } from "lucide-react";
import { useNavigation } from "@/hooks/useContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SmartLink } from "@/components/ui/SmartLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CitySelect } from "./CitySelect";
import { SearchBox } from "./SearchBox";
import { ACCOUNT_LINKS, UserMenu } from "./UserMenu";

function isActive(pathname: string, url: string) {
  const path = url.split("?")[0];
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const nav = useNavigation();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [menuOpen, setMenuOpen] = useState(false);
  const next = pathname === "/login" || pathname === "/verify" ? "" : `?next=${encodeURIComponent(pathname)}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="container-page flex h-16 items-center gap-3 lg:h-[72px] lg:gap-5">
        <Link href="/" aria-label="صفحه اصلی" className="shrink-0">
          <BrandLogo width={96} className="h-11 w-auto lg:h-[54px]" />
        </Link>

        <nav aria-label="منوی اصلی" className="hidden h-full items-center gap-6 xl:flex">
          {nav.isLoading
            ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-4 w-14" />)
            : nav.data?.header.map((item) => {
                const active = isActive(pathname, item.url);
                return (
                  <SmartLink
                    key={item.id}
                    link={item}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-full items-center text-[14px] font-semibold transition-colors",
                      active ? "text-brand-600 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand-600" : "text-ink hover:text-brand-600",
                    )}
                  />
                );
              })}
        </nav>

        <SearchBox className="hidden flex-1 lg:block lg:max-w-[440px] xl:mr-auto" />
        <CitySelect className="hidden w-[150px] lg:block" />
        <ThemeToggle className="hidden lg:flex" />

        <div className="hidden items-center gap-2.5 lg:flex">
          {!hydrated ? (
            <Skeleton className="h-11 w-[220px] rounded-xl" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <ButtonLink href={`/login${next}`} variant="outline" size="sm" className="min-h-11 px-5">
                <UserRound className="size-[18px]" />
                ورود
              </ButtonLink>
              <ButtonLink href={`/login${next}`} size="sm" className="min-h-11 px-5 shadow-none">
                <UserPlus className="size-[18px]" />
                ثبت‌نام
              </ButtonLink>
            </>
          )}
        </div>

        <div className="mr-auto flex items-center gap-1.5 lg:hidden">
          <ThemeToggle />
          <Link
            href={user ? "/profile" : `/login${next}`}
            aria-label={user ? "حساب کاربری" : "ورود / ثبت‌نام"}
            className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white"
          >
            <UserRound className="size-5" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="باز کردن منو"
            aria-expanded={menuOpen}
            className="flex size-11 items-center justify-center rounded-xl border border-line text-ink"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Search and city stay one tap away on phones and tablets */}
      <div className="container-page flex gap-2 pb-3 lg:hidden">
        <SearchBox className="min-w-0 flex-1" />
        <CitySelect className="w-[142px] sm:w-[160px]" />
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="منو" variant="drawer">
        <nav aria-label="منوی موبایل" className="flex flex-col">
          {nav.data?.header.map((item) => (
            <SmartLink
              key={item.id}
              link={item}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex min-h-12 items-center border-b border-line/70 text-[15px] font-semibold",
                isActive(pathname, item.url) ? "text-brand-600" : "text-ink",
              )}
            />
          ))}
        </nav>
        <div className="mt-5 space-y-1">
          {user ? (
            <>
              {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-2 text-[14.5px] font-semibold text-ink hover:bg-field">
                  <Icon className="size-5 text-ink-2" />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                  router.push("/");
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-[14.5px] font-semibold text-danger-fg hover:bg-danger-bg"
              >
                <LogOut className="size-5" />
                خروج از حساب
              </button>
            </>
          ) : (
            <ButtonLink href={`/login${next}`} block onClick={() => setMenuOpen(false)}>
              <LogIn className="size-5" />
              ورود / ثبت‌نام
            </ButtonLink>
          )}
        </div>
      </Dialog>
    </header>
  );
}
