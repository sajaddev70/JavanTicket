"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/useToastStore";
import { cn } from "@/lib/cn";

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-3" dir="rtl">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-md animate-[toast-in_0.18s_ease] items-start gap-3 rounded-2xl border bg-surface px-4 py-3 shadow-float",
              t.tone === "success" && "border-success/30",
              t.tone === "error" && "border-danger/30",
              t.tone === "info" && "border-brand-500/30",
            )}
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", t.tone === "success" ? "text-success" : t.tone === "error" ? "text-danger-fg" : "text-brand-600")} />
            <p className="flex-1 text-[14px] font-medium leading-6 text-ink">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="بستن پیام" className="-m-1.5 flex size-8 items-center justify-center rounded-lg text-muted hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
