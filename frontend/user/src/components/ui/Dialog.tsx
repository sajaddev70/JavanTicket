"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useIsClient } from "@/hooks/useIsClient";

/**
 * Modal surface: a centered dialog on desktop and a bottom sheet on phones ("sheet"), or a side drawer ("drawer").
 * Escape and the backdrop close it, focus moves inside and returns to the opener, the page behind does not scroll.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  variant = "sheet",
  className,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: "sheet" | "drawer";
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const client = useIsClient();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus], input, select, textarea, button:not([data-close])");
    (first ?? panel.current)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key !== "Tab" || !panel.current) return;
      // Keep Tab inside the dialog.
      const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!items.length) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!client || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" dir="rtl">
      <div className="absolute inset-0 animate-[fade-in_0.15s_ease] bg-navy-950/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[88vh] w-full flex-col bg-surface shadow-float outline-none",
          variant === "sheet" && "animate-[sheet-up_0.22s_ease] rounded-t-[22px] sm:max-w-lg sm:animate-[toast-in_0.18s_ease] sm:rounded-[22px]",
          variant === "drawer" && "fixed inset-y-0 right-0 max-h-none max-w-[340px] animate-[fade-in_0.15s_ease]",
          className,
        )}
      >
        {variant === "sheet" && <span className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line-strong sm:hidden" aria-hidden />}
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
          <div>
            <h2 id={titleId} className="text-[17px] font-black text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <button type="button" data-close onClick={onClose} aria-label="بستن" className="-ml-2 flex size-11 items-center justify-center rounded-xl text-muted hover:bg-field hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 pb-safe">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
