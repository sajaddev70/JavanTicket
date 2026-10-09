'use client';

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export interface RowMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

/** "⋯" button opening a small action menu. */
export function RowMenu({ items, vertical }: { items: RowMenuItem[]; vertical?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="عملیات بیشتر"
        className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-brand-500/40"
      >
        <MoreHorizontal className={cn("size-5", vertical && "rotate-90")} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-float">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-2.5 text-right text-[13.5px] font-medium hover:bg-field",
                item.danger ? "text-danger-fg" : "text-ink",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
