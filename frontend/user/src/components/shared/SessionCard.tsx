"use client";

import { ChevronLeft } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { faDayMonth, faNumber, faTime, faWeekday } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { EventSession } from "@/types/event";

export type Availability = { label: string; tone: "ok" | "low" | "none"; bookable: boolean };

/** Availability of a session from its live seat counts (backend), as on the reference: ظرفیت مناسب / تعداد محدود / تکمیل. */
export function sessionAvailability(s: EventSession): Availability {
  if (s.status !== "ACTIVE") return { label: "به‌زودی", tone: "none", bookable: false };
  if (s.available_seats <= 0) return { label: "تکمیل ظرفیت", tone: "none", bookable: false };
  if (s.available_seats <= Math.max(10, s.capacity * 0.1)) return { label: "تعداد محدود", tone: "low", bookable: true };
  return { label: "ظرفیت مناسب", tone: "ok", bookable: true };
}

const DOT = { ok: "bg-success", low: "bg-warning", none: "bg-danger" } as const;

/** One session: weekday, date, time, availability and starting price; selecting it drives the buy button. */
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
        "flex h-full w-full flex-col gap-2 rounded-2xl border bg-surface p-3 text-right transition disabled:cursor-not-allowed",
        selected ? "border-brand-600 ring-2 ring-brand-500/20" : "border-line hover:border-brand-500/40",
        !a.bookable && "opacity-60",
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span>
          <span className="block text-[14px] font-black text-ink">{faWeekday(session.start_time)}</span>
          <span className="block text-[12.5px] text-ink-2">{faDayMonth(session.start_time)}</span>
        </span>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", selected ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600")} aria-hidden>
          <ChevronLeft className="size-[18px]" />
        </span>
      </span>
      {session.title && <span className="line-clamp-1 text-[12px] text-muted">{session.title}</span>}
      <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink">
        <Icon name="common/clock" className="size-4 text-muted" />
        <span className="tabular">{faTime(session.start_time)}</span>
      </span>
      <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
        <span className={cn("size-2.5 shrink-0 rounded-full", DOT[a.tone])} aria-hidden />
        {a.label}
      </span>
      <span className="mt-auto text-[12.5px] text-brand-600">
        از <b className="text-[14px] font-black">{faNumber(session.from_price)}</b> تومان
      </span>
    </button>
  );
}
