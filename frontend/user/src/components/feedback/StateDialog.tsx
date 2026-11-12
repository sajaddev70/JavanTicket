"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useIsClient } from "@/hooks/useIsClient";

/** Symbols of the design's state boxes and empty states. */
export const SYMBOL = {
  warning: "⚠️",
  wait: "⌛",
  success: "✅",
  check: "✓",
  failed: "❌",
  ticket: "🎟️",
  calendar: "📅",
  search: "🔍",
  receipt: "🧾",
  heart: "♡",
  shield: "🛡️",
  user: "👤",
  tag: "🏷️",
} as const;

/**
 * The design's .statebox (warning, expiry, success ...) over the dimmed page. The button defaults to the design's
 * "متوجه شدم"; Escape does the same as [onDismiss], which defaults to the button's action.
 */
export function StateDialog({
  symbol,
  title,
  message,
  onAction,
  actionLabel = "متوجه شدم",
  onDismiss,
}: {
  symbol: string;
  title: string;
  message?: string | null;
  onAction: () => void;
  actionLabel?: string;
  onDismiss?: () => void;
}) {
  const client = useIsClient();
  const button = useRef<HTMLButtonElement>(null);
  const dismiss = useRef(onDismiss ?? onAction);
  useEffect(() => {
    dismiss.current = onDismiss ?? onAction;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    button.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss.current();
      // The button is the only control: Tab stays on it.
      if (e.key === "Tab") e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [client]);

  if (!client) return null;
  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#020b25]/50 px-7 animate-[fade-in_0.15s_ease]" dir="rtl">
      <div role="alertdialog" aria-modal="true" aria-labelledby="state-title" aria-describedby={message ? "state-message" : undefined} className={BOX}>
        <div aria-hidden className="text-[52px] leading-[1.25]">
          {symbol}
        </div>
        <h2 id="state-title" className="mt-3 text-[20px] font-black text-ink">
          {title}
        </h2>
        {message && (
          <p id="state-message" className="mt-2 text-[13px] leading-[2] text-ink-2">
            {message}
          </p>
        )}
        <Button ref={button} size="xl" block className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

const BOX = "w-full max-w-[420px] rounded-[22px] border border-[#bd87ff] bg-surface-solid p-[23px] text-center shadow-float";

/** Work in progress: the state box with a spinner and no button (there is nothing to confirm yet). */
export function LoadingOverlay({ title, message }: { title: string; message?: string }) {
  const client = useIsClient();
  if (!client) return null;
  return createPortal(
    <div role="status" className="fixed inset-0 z-[74] flex items-center justify-center bg-[#020b25]/50 px-7" dir="rtl">
      <div className={BOX}>
        <span aria-hidden className="mx-auto block size-11 animate-spin rounded-full border-[3px] border-line border-t-ink" />
        <h2 className="mt-4 text-[20px] font-black text-ink">{title}</h2>
        {message && <p className="mt-2 text-[13px] leading-[2] text-ink-2">{message}</p>}
      </div>
    </div>,
    document.body,
  );
}
