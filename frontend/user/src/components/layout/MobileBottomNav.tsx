"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { showsBottomNav } from "./chrome";

/** Height of the bar without the home indicator; screens with a sticky action bar sit right above it. */
export const BOTTOM_NAV_HEIGHT = 64;

/** The four destinations of the PWA on phones: خانه، رویدادها، بلیت‌های من، پروفایل. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  if (!showsBottomNav(pathname)) return null;

  const tabs: { href: string; label: string; icon: IconName; active: boolean }[] = [
    { href: "/", label: "خانه", icon: "navigation/home", active: pathname === "/" },
    { href: "/events", label: "رویدادها", icon: "navigation/events", active: pathname.startsWith("/events") },
    { href: authenticated ? "/tickets" : "/login?next=/tickets", label: "بلیت‌های من", icon: "navigation/my-tickets", active: pathname.startsWith("/tickets") },
    {
      href: authenticated ? "/profile" : "/login?next=/profile",
      label: "پروفایل",
      icon: "navigation/profile",
      active: ["/profile", "/orders", "/favorites"].some((p) => pathname.startsWith(p)),
    },
  ];

  return (
    <>
      {/* Keeps the end of the page clear of the fixed bar */}
      <div className="h-bottom-nav lg:hidden" aria-hidden />
      <nav
        aria-label="دسترسی سریع"
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-[26px] border-t border-line bg-surface/95 pb-safe shadow-nav backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-[560px] grid-cols-4">
          {tabs.map(({ href, label, icon, active }) => (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-0.5 text-[11.5px] transition-colors",
                  active ? "font-black text-purple" : "font-bold text-ink-2 hover:text-ink",
                )}
              >
                <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition", active && "bg-purple-bg")}>
                  <Icon name={icon} className="size-[23px]" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
