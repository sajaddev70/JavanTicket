'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, MapPin, Menu, Search, UserRound, X } from "lucide-react";
import { useCities, useNavigation } from "@/hooks/usePublicData";
import { useCityStore } from "@/stores/useCityStore";
import { useUserAuthStore } from "@/stores/useUserAuthStore";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SmartLink } from "@/components/ui/SmartLink";

function CitySelect({ className }: { className?: string }) {
  const { data: cities } = useCities();
  const { cityId, setCityId } = useCityStore();
  return (
    <label className={cn("relative flex h-12 items-center", className)}>
      <span className="sr-only">انتخاب شهر</span>
      <MapPin className="pointer-events-none absolute right-4 size-[19px] text-ink" />
      <select
        value={cityId ?? ""}
        onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
        className="h-full w-full appearance-none rounded-xl border border-line bg-surface pr-11 pl-10 text-[15px] font-bold text-ink outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10"
      >
        <option value="">همه شهرها</option>
        {cities?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute left-4 size-4 text-ink/70" />
    </label>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUserAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const nav = useNavigation().data?.header ?? [];

  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (q) {
      setOpen(false);
      router.push(`/events?q=${encodeURIComponent(q)}`);
    }
  }

  const searchBox = (
    <form onSubmit={search} role="search" className="relative w-full">
      <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-ink/70" />
      <input
        name="q"
        type="search"
        placeholder="جستجو در رویدادها، شهرها و سالن‌ها ..."
        className="h-12 w-full rounded-xl border border-transparent bg-field pr-12 pl-4 text-[14px] text-ink outline-none placeholder:text-muted focus:border-brand-500/40 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
      />
    </form>
  );

  const account = (
    <Link
      href={user ? "/profile" : "/login"}
      className="flex h-12 shrink-0 items-center gap-2.5 rounded-xl bg-brand-600 px-5 text-[15px] font-bold text-white shadow-[0_8px_18px_rgb(20_99_230_/_0.25)] hover:bg-brand-700"
    >
      <UserRound className="size-5" />
      <span className="truncate">{user ? user.fullName || "حساب کاربری" : "ورود / ثبت‌نام"}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-4 px-4 lg:h-[84px] lg:px-10">
        <Link href="/" aria-label="صفحه اصلی" className="shrink-0">
          <BrandLogo width={74} className="h-[52px] w-auto lg:h-[64px]" />
        </Link>

        <nav aria-label="منوی اصلی" className="hidden items-center gap-6 xl:flex">
          {nav.map((item) => {
            const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
            return (
              <SmartLink
                key={item.id}
                link={item}
                className={cn(
                  "relative py-2 text-[14.5px] font-semibold transition-colors",
                  active ? "text-brand-600 after:absolute after:inset-x-0 after:-bottom-[22px] after:h-[3px] after:rounded-full after:bg-brand-600" : "text-ink hover:text-brand-600",
                )}
              />
            );
          })}
        </nav>

        <div className="hidden flex-1 lg:block lg:max-w-[460px] xl:mr-auto">{searchBox}</div>
        <CitySelect className="hidden w-[168px] shrink-0 lg:flex" />
        <ThemeToggle className="hidden lg:flex" />
        <div className="hidden lg:block">{account}</div>

        <div className="mr-auto flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Link href={user ? "/profile" : "/login"} aria-label="حساب کاربری" className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <UserRound className="size-5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            className="flex size-11 items-center justify-center rounded-xl border border-line text-ink"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Search + city stay reachable on small screens */}
      <div className="flex gap-2 px-4 pb-3 lg:hidden">
        <div className="flex-1">{searchBox}</div>
        <CitySelect className="w-[132px] shrink-0" />
      </div>

      {open && nav.length > 0 && (
        <nav aria-label="منوی موبایل" className="border-t border-line bg-surface px-4 py-2 lg:hidden">
          {nav.map((item) => (
            <SmartLink
              key={item.id}
              link={item}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center border-b border-line/60 text-[15px] font-semibold text-ink last:border-0"
            />
          ))}
        </nav>
      )}
    </header>
  );
}
