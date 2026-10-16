"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  badge?: number;
}

/**
 * Accessible tab list (WAI-ARIA tabs): arrow keys move between tabs, following RTL order
 * (ArrowLeft goes to the next tab, ArrowRight to the previous one).
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  idBase,
  className,
  variant = "underline",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  idBase: string;
  className?: string;
  variant?: "underline" | "pill";
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    const target = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : step ? (index + step + items.length) % items.length : -1;
    if (target < 0) return;
    e.preventDefault();
    refs.current[target]?.focus();
    onChange(items[target].value);
  }

  return (
    <div role="tablist" className={cn("no-scrollbar flex overflow-x-auto", variant === "underline" ? "gap-1 border-b border-line" : "gap-2", className)}>
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${item.value}`}
            aria-selected={active}
            aria-controls={`${idBase}-panel-${item.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "flex min-h-12 shrink-0 items-center gap-2 px-4 text-[14.5px] font-bold transition",
              variant === "underline" && ["-mb-px border-b-[3px]", active ? "border-brand-600 text-brand-600" : "border-transparent text-ink-2 hover:text-ink"],
              variant === "pill" && ["rounded-xl border", active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink-2 hover:border-brand-500/40"],
            )}
          >
            {item.label}
            {item.badge !== undefined && (
              <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11.5px]", active && variant === "pill" ? "bg-white/20" : "bg-field text-muted")}>
                {item.badge.toLocaleString("fa-IR")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, value, children, className }: { idBase: string; value: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel-${value}`} aria-labelledby={`${idBase}-tab-${value}`} tabIndex={0} className={cn("outline-none", className)}>
      {children}
    </div>
  );
}
