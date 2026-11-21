"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { ACCOUNT_LINKS } from "@/components/layout/UserMenu";
import { useAuthStore } from "@/stores/useAuthStore";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { maskMobile } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Layout of the account pages: menu (side on desktop, tabs on phones) and the page body. */
export function AccountShell({
  title,
  description,
  actions,
  header,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Replaces the white title on the band (the profile screen draws its own avatar header). */
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="container-page grid gap-5 pb-10 pt-1 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:pt-6">
      <aside className="card hidden p-4 lg:sticky lg:top-28 lg:block">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <span className="bg-grad-primary flex size-12 items-center justify-center rounded-full text-white">
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-black text-ink">{user?.fullName || "کاربر"}</p>
            {user && (
              <p className="text-[12.5px] text-muted" dir="ltr">
                {maskMobile(user.mobile)}
              </p>
            )}
          </div>
        </div>
        <nav aria-label="حساب کاربری" className="mt-3 space-y-1">
          {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-[14.5px] font-bold transition", active ? "bg-brand-50 text-brand-600" : "text-ink-2 hover:bg-field")}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-[14.5px] font-bold text-danger-fg hover:bg-danger-bg"
          >
            <LogOut className="size-5" />
            خروج از حساب
          </button>
        </nav>
      </aside>

      <div className="min-w-0 space-y-4">
        {header ?? (
          <div className="flex flex-wrap items-end justify-between gap-3 text-white">
            <div>
              <Breadcrumb tone="light" className="hidden lg:block" items={[{ label: "خانه", href: "/" }, { label: "حساب کاربری", href: "/profile" }, { label: title }]} />
              <h1 className="text-[24px] font-black leading-[1.5] lg:mt-1.5 lg:text-[28px]">{title}</h1>
              {description && <p className="mt-0.5 text-[13.5px] leading-6 text-white/80">{description}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
