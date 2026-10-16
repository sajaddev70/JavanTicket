"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, LogOut, Receipt, Ticket, UserRound } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { maskMobile } from "@/lib/format";
import { cn } from "@/lib/cn";

export const ACCOUNT_LINKS = [
  { href: "/profile", label: "حساب کاربری", icon: UserRound },
  { href: "/tickets", label: "بلیت‌های من", icon: Ticket },
  { href: "/orders", label: "سفارش‌های من", icon: Receipt },
  { href: "/favorites", label: "علاقه‌مندی‌ها", icon: Heart },
];

/** Account menu of a signed-in user: a button opening a menu (Escape / outside click close it). */
export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const name = user.fullName?.trim() || "حساب کاربری";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 text-[14px] font-bold text-ink hover:border-brand-500/40"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <UserRound className="size-4" />
        </span>
        <span className="max-w-[140px] truncate">{name}</span>
        <ChevronDown className={cn("size-4 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-[calc(100%+8px)] z-50 w-60 animate-[toast-in_0.15s_ease] rounded-2xl border border-line bg-surface p-2 shadow-float">
          <p className="px-3 pb-2 pt-1 text-[12.5px] text-muted" dir="ltr">
            {maskMobile(user.mobile)}
          </p>
          {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold text-ink hover:bg-field"
            >
              <Icon className="size-[18px] text-ink-2" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
              router.push("/");
            }}
            className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl border-t border-line px-3 text-[14px] font-semibold text-danger-fg hover:bg-danger-bg"
          >
            <LogOut className="size-[18px]" />
            خروج از حساب
          </button>
        </div>
      )}
    </div>
  );
}
