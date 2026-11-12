"use client";

import { faDayMonth, faNumber, faTime, faWeekday } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { EventSession } from "@/types/event";

export type Availability = { label: string; tone: "ok" | "low" | "none"; bookable: boolean };

/** Availability of a session from its live seat counts (backend), as on the reference: ظرفیت مناسب / تعداد محدود / تکمیل. */
export function sessionAvailability(s: EventSession): Availability {
  if (s.status !== "ACTIVE") return { label: "به‌زودی", tone: "none", bookable: false };
  if (s.available_seats <= 0) return { label: "تکمیل ظرفیت", tone: "none", bookable: false };
  if (s.available_seats <= Math.max(10, s.capacity * 0.1)) return { label: "ظرفیت محدود", tone: "low", bookable: true };
  return { label: "ظرفیت مناسب", tone: "ok", bookable: true };
}

/** Capacity pill colors of the reference: green / orange / red. */
const PILL = {
  ok: "bg-success-bg text-success-fg",
  low: "bg-warning-bg text-warning-fg",
  none: "bg-danger-bg text-danger-fg",
} as const;
const DOT = { ok: "bg-success", low: "bg-warning", none: "bg-danger" } as const;

/** One session (reference 04): day and date, time range, capacity pill and starting price, with a radio mark. */
export function SessionCard({ session, selected, onSelect }: { session: EventSession; selected: boolean; onSelect: () => void }) {
  const a = sessionAvailability(session);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!a.bookable}
      aria-pressed={selected}
      aria-label={`${faWeekday(session.start_time)} ${faDayMonth(session.start_time)} ساعت ${faTime(session.start_time)}، ${a.label}، از ${faNumber(session.from_price)} تومان`}
      className={cn(
        "flex h-full w-full items-center gap-3 rounded-[22px] border border-line bg-surface p-4 text-right shadow-card transition disabled:cursor-not-allowed",
        selected ? "card-selected" : "hover:border-brand-500/40",
        !a.bookable && "opacity-70",
      )}
    >
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-[17px] font-black leading-7 text-ink">
          {faWeekday(session.start_time)} {faDayMonth(session.start_time)}
        </span>
        <span className="block text-[14px] font-bold text-ink-2 tabular">
          {faTime(session.start_time)}
          {session.end_time && ` تا ${faTime(session.end_time)}`}
        </span>
        {session.title && <span className="line-clamp-1 block text-[12px] text-muted">{session.title}</span>}
        <span className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-black", PILL[a.tone])}>
            <span className={cn("size-2.5 shrink-0 rounded-full", DOT[a.tone])} aria-hidden />
            {a.label}
          </span>
          {a.bookable && (
            <span className="text-[12.5px] text-price">
              از <b className="text-[14px] font-black">{faNumber(session.from_price)}</b> تومان
            </span>
          )}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition",
          selected ? "border-purple-600" : "border-ink-2/60",
        )}
      >
        {selected && <span className="size-3.5 rounded-full bg-grad-primary" />}
      </span>
    </button>
  );
}
