"use client";

import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { formatClock, useCountdown } from "@/hooks/useCountdown";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Countdown of a seat hold / order, from the server's `seconds_left` (never a client-side timer of its own).
 * Calls [onExpire] once when it reaches zero.
 */
export function HoldTimer({
  secondsLeft,
  receivedAt,
  onExpire,
  variant = "chip",
  className,
}: {
  secondsLeft: number | null | undefined;
  receivedAt: number;
  onExpire?: () => void;
  variant?: "chip" | "large" | "text";
  className?: string;
}) {
  const left = useCountdown(secondsLeft, receivedAt);
  const expired = useRef(false);
  useEffect(() => {
    if (left === null) return;
    if (left > 0) expired.current = false;
    else if (!expired.current) {
      expired.current = true;
      onExpire?.();
    }
  }, [left, onExpire]);

  if (left === null) return null;
  const urgent = left <= 60;
  const clock = (
    <span className="tabular" dir="ltr">
      {toFaDigits(formatClock(left))}
    </span>
  );
  // Screen readers get the remaining minutes, not a value changing every second.
  const label = `زمان باقی‌مانده: ${toFaDigits(String(Math.ceil(left / 60)))} دقیقه`;

  if (variant === "text") return <span className={className} aria-label={label}>{clock}</span>;
  if (variant === "large") {
    return (
      <span className={cn("text-[28px] font-black", urgent ? "text-danger-fg" : "text-brand-600", className)} role="timer" aria-label={label}>
        {clock}
      </span>
    );
  }
  return (
    <span
      role="timer"
      aria-label={label}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[14px] font-black", urgent ? "bg-danger-bg text-danger-fg" : "bg-brand-50 text-brand-600", className)}
    >
      <Clock className="size-4" />
      {clock}
    </span>
  );
}
