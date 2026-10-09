'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminMenu } from "@/hooks/useAdmin";
import { MenuItemIcon } from "./MenuItemIcon";
import { cn } from "@/lib/cn";

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const menu = useAdminMenu();

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-[2px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[264px] flex-col bg-navy-900 text-white dark:border-l dark:border-white/5 transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[232px] lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "translate-x-full",
        )}
        aria-label="منوی اصلی"
      >
        <div className="relative flex shrink-0 justify-center px-4 pb-3 pt-4">
          <Link href="/dashboard" onClick={onClose} aria-label="داشبورد">
            <BrandLogo variant="light" width={122} className="max-h-[100px] w-[122px]" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-3 rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="بستن منو"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
          {menu.isLoading &&
            Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="mb-2 h-[42px] rounded-[10px] bg-white/10" />)}
          {menu.isError && (
            <button type="button" onClick={() => menu.refetch()} className="w-full rounded-[10px] px-3 py-3 text-right text-[13px] text-white/80 hover:bg-white/10">
              دریافت منو با خطا مواجه شد. تلاش مجدد
            </button>
          )}
          {menu.data?.sidebar.map((group, gi) => (
            <div key={gi} className={cn(gi > 0 && "mt-2 border-t border-white/10 pt-2")}>
              {group.map((item) => {
                const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.key}
                    href={item.path}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-[14.5px] font-medium transition-colors",
                      active
                        ? "bg-brand-600 text-white shadow-[0_6px_16px_rgb(26_110_232_/_0.35)]"
                        : "text-white/85 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    <MenuItemIcon icon={item.icon} />
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.key !== "dashboard" && (
                      <ChevronLeft className={cn("size-4 shrink-0", active ? "text-white/80" : "text-white/40")} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
