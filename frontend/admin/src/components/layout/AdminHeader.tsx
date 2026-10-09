'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays, ChevronDown, LogOut, MapPin, Menu, MessageSquareText, Search, LayoutGrid } from "lucide-react";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminFilterStore } from "@/stores/useAdminFilterStore";
import { useCityOptions, useSystemAlerts } from "@/hooks/useDashboard";
import { useAdminProfile } from "@/hooks/useAdmin";
import { faFullDate, faNumber, faWeekday } from "@/lib/format";
import { useIsClient } from "@/hooks/useIsClient";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function initials(name?: string) {
  const first = name?.trim().split(/\s+/)[0] ?? "";
  return first.slice(0, 2) || "؟";
}

export function AdminHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const { user, logout } = useAdminAuthStore();
  const profile = useAdminProfile();
  const { cityId, setCityId } = useAdminFilterStore();
  const cities = useCityOptions();
  const alerts = useSystemAlerts();
  // Client-only so the date always reflects the viewer's clock.
  const today = useIsClient() ? new Date() : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const alertCount = alerts.data?.total ?? 0;
  const fullName = profile.data?.fullName ?? user?.fullName;
  const roleLabel = profile.data?.roles.map((r) => r.title).join("، ") || "";

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (q) router.push(`/events?q=${encodeURIComponent(q)}`);
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/70 bg-surface/95 px-3 backdrop-blur sm:px-5 lg:h-[70px]">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex size-10 items-center justify-center rounded-xl text-ink hover:bg-field lg:hidden"
        aria-label="باز کردن منو"
      >
        <Menu className="size-6" />
      </button>

      <form onSubmit={handleSearch} className="relative hidden max-w-[410px] flex-1 md:block" role="search">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input
          name="q"
          type="search"
          placeholder="جستجو در رویدادها، کاربران، سفارشات و ..."
          className="h-11 w-full rounded-xl border border-line bg-field pr-11 pl-4 text-sm text-ink outline-none transition placeholder:text-muted/80 focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
        />
      </form>

      <label className="relative hidden h-11 w-[200px] shrink-0 items-center sm:flex">
        <span className="sr-only">انتخاب شهر</span>
        <MapPin className="pointer-events-none absolute right-3.5 size-[18px] text-ink/80" />
        <select
          value={cityId ?? ""}
          onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
          className="h-full w-full appearance-none rounded-xl border border-line bg-surface pr-10 pl-9 text-sm font-semibold text-ink outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10"
        >
          <option value="">همه شهرها</option>
          {cities.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute left-3 size-4 text-muted" />
      </label>

      <div className="flex-1 md:hidden" />

      <div className="hidden items-center gap-2.5 xl:flex">
        <CalendarDays className="size-[22px] text-ink/80" strokeWidth={1.7} />
        {today && (
          <div className="leading-tight">
            <div className="text-[12px] text-muted">{faWeekday(today)}</div>
            <div className="text-[13px] font-semibold text-ink">{faFullDate(today)}</div>
          </div>
        )}
      </div>

      <span className="mx-1 hidden h-8 w-px bg-line xl:block" />

      <ThemeToggle />

      <button
        type="button"
        className="hidden size-10 items-center justify-center rounded-xl text-ink/80 hover:bg-field sm:flex"
        aria-label="پیام‌ها"
      >
        <MessageSquareText className="size-[22px]" strokeWidth={1.7} />
      </button>

      <Link
        href="/dashboard#alerts"
        className="relative flex size-10 items-center justify-center rounded-xl text-ink/80 hover:bg-field"
        aria-label={`اعلان‌ها${alertCount ? ` (${faNumber(alertCount)})` : ""}`}
      >
        <Bell className="size-[22px]" strokeWidth={1.7} />
        {alertCount > 0 && (
          <span className="absolute right-1 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {faNumber(Math.min(alertCount, 99))}
          </span>
        )}
      </Link>

      <span className="mx-1 hidden h-8 w-px bg-line sm:block" />

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl p-1 hover:bg-field sm:gap-3 sm:pl-2"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-sm font-bold text-ink">{fullName ?? "—"}</span>
            <span className="block text-[12px] text-muted">{roleLabel}</span>
          </span>
          <ChevronDown className="hidden size-4 text-muted sm:block" />
          <span className="flex size-11 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white ring-4 ring-navy-900/10">
            {initials(fullName ?? undefined)}
          </span>
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-float"
          >
            <Link
              href="/menu"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-field"
            >
              <LayoutGrid className="size-4 text-muted" />
              ساختار منوها
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/5"
            >
              <LogOut className="size-4" />
              خروج از حساب
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
