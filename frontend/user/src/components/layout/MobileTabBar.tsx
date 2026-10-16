"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, Ticket, UserRound } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/cn";

/** Pages with their own sticky action bar (seat map, checkout, ...) hide the tab bar. */
const HIDDEN = [/^\/sessions\//, /^\/checkout/, /^\/payment/, /^\/login/, /^\/verify/, /^\/events\/[^/]+$/];

export function MobileTabBar() {
  const pathname = usePathname();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  if (HIDDEN.some((r) => r.test(pathname))) return null;

  const tabs = [
    { href: "/", label: "خانه", icon: House, active: pathname === "/" },
    { href: "/events", label: "رویدادها", icon: CalendarDays, active: pathname.startsWith("/events") },
    { href: authenticated ? "/tickets" : "/login?next=/tickets", label: "بلیت‌های من", icon: Ticket, active: pathname.startsWith("/tickets") },
    {
      href: authenticated ? "/profile" : "/login",
      label: authenticated ? "حساب من" : "ورود",
      icon: UserRound,
      active: ["/profile", "/orders", "/favorites"].some((p) => pathname.startsWith(p)),
    },
  ];

  return (
    <>
      {/* Keeps the end of the page clear of the fixed bar */}
      <div className="h-[68px] lg:hidden" aria-hidden />
      <nav aria-label="دسترسی سریع" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur lg:hidden">
        <ul className="grid h-[64px] grid-cols-4">
          {tabs.map(({ href, label, icon: Icon, active }) => (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex h-full flex-col items-center justify-center gap-1 text-[11.5px] font-semibold", active ? "text-brand-600" : "text-muted")}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
