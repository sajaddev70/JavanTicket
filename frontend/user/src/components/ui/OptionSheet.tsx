"use client";

import { Check } from "lucide-react";
import { Dialog } from "./Dialog";
import { cn } from "@/lib/cn";

export interface SheetOption {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}

/** Single-choice list in a bottom sheet (a centered dialog from `sm` up): category, city, date and sort filters. */
export function OptionSheet({
  open,
  onClose,
  title,
  options,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: SheetOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <ul role="listbox" aria-label={title} className="space-y-1">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <li key={o.value || "_"} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  onClose();
                }}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-right text-[14.5px] font-bold transition",
                  selected ? "bg-brand-50 text-brand-600" : "text-ink hover:bg-field",
                )}
              >
                {o.icon && <span className="shrink-0">{o.icon}</span>}
                <span className="flex-1">{o.label}</span>
                {o.hint && <span className="text-[12px] font-medium text-muted">{o.hint}</span>}
                {selected && <Check className="size-5 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
