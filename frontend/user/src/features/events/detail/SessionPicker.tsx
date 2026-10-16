"use client";

import { CalendarDays } from "lucide-react";
import { Carousel } from "@/components/ui/Carousel";
import { faNumber, faTimeRange, faFullDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { EventSession } from "@/types/event";

export type Availability = { label: string; tone: "ok" | "low" | "none"; bookable: boolean };

export function sessionAvailability(s: EventSession): Availability {
  if (s.status !== "ACTIVE") return { label: "به‌زودی", tone: "none", bookable: false };
  if (s.available_seats <= 0) return { label: "تکمیل ظرفیت", tone: "none", bookable: false };
  if (s.available_seats <= Math.max(10, s.capacity * 0.1)) return { label: `ظرفیت محدود (${faNumber(s.available_seats)} جای خالی)`, tone: "low", bookable: true };
  return { label: "موجود", tone: "ok", bookable: true };
}

/** "انتخاب سانس و خرید بلیت": one card per upcoming session; the chosen one drives the buy button. */
export function SessionPicker({ sessions, selectedId, onSelect }: { sessions: EventSession[]; selectedId: number | null; onSelect: (id: number) => void }) {
  return (
    <Carousel label="سانس‌ها" itemClassName="w-[78%] sm:w-[44%] xl:w-[calc((100%-48px)/4)]">
      {sessions.map((s) => {
        const a = sessionAvailability(s);
        const selected = s.id === selectedId;
        return (
          <div
            key={s.id}
            className={cn(
              "flex h-full flex-col rounded-2xl border bg-surface p-3.5 transition",
              selected ? "border-brand-600 ring-2 ring-brand-500/20" : "border-line",
              !a.bookable && "opacity-70",
            )}
          >
            <p className="flex items-center gap-2 text-[14.5px] font-black text-ink">
              <CalendarDays className="size-5 text-brand-600" />
              {faFullDate(s.start_time)}
            </p>
            {s.title && <p className="mt-1 line-clamp-1 text-[12.5px] text-ink-2">{s.title}</p>}
            <p className="tabular mt-1.5 text-[13px] text-muted">{faTimeRange(s.start_time, s.end_time)}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold">
              <span className={cn("size-2.5 rounded-full", a.tone === "ok" ? "bg-success" : a.tone === "low" ? "bg-warning" : "bg-muted")} aria-hidden />
              <span className={a.tone === "ok" ? "text-success-fg" : a.tone === "low" ? "text-warning" : "text-muted"}>{a.label}</span>
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              <span className="text-[12.5px] text-ink-2">
                از <b className="text-[14px] font-black text-ink">{faNumber(s.from_price)}</b> تومان
              </span>
              <button
                type="button"
                disabled={!a.bookable}
                onClick={() => onSelect(s.id)}
                aria-pressed={selected}
                className={cn(
                  "min-h-10 shrink-0 rounded-lg border px-3.5 text-[13px] font-bold transition disabled:cursor-not-allowed",
                  selected ? "border-brand-600 bg-brand-600 text-white" : "border-brand-500/50 text-brand-600 hover:bg-brand-50",
                )}
              >
                {selected ? "انتخاب شد" : "انتخاب سانس"}
              </button>
            </div>
          </div>
        );
      })}
    </Carousel>
  );
}
