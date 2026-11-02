"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { ACCOUNT_LINKS } from "@/components/layout/UserMenu";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { useAuthStore } from "@/stores/useAuthStore";
import { maskMobile } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Layout of the account pages: the design's header on top; from `lg` up, the account menu beside the page body. */
export function AccountShell({ title, noBack, fallbackHref = "/profile", onBack, children }: { title: string; noBack?: boolean; fallbackHref?: string; onBack?: () => void; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="container-page grid gap-5 !px-0 pb-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:!px-8 lg:pt-6">
      <aside className="card hidden p-4 lg:sticky lg:top-24 lg:block">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-field text-ink">
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
                className={cn("flex min-h-12 items-center gap-3 rounded-[15px] px-3 text-[14px] font-bold transition", active ? "bg-chip text-white" : "text-ink-2 hover:bg-field")}
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
            className="flex min-h-12 w-full items-center gap-3 rounded-[15px] px-3 text-[14px] font-bold text-danger-fg hover:bg-danger-bg"
          >
            <LogOut className="size-5" />
            خروج از حساب
          </button>
        </nav>
      </aside>

      <div className="min-w-0">
        <PageTopBar title={title} noBack={noBack} fallbackHref={fallbackHref} onBack={onBack} className="lg:!px-0 [&>div:last-child]:lg:mt-0" />
        <div className="px-4 pt-1.5 sm:px-6 lg:px-0 lg:pt-3">{children}</div>
      </div>
    </div>
  );
}
