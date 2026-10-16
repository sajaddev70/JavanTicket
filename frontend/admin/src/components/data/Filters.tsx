'use client';

import { useEffect, useState } from "react";
import { CalendarDays, Download, Loader2, Search } from "lucide-react";
import { faNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Search box that reports its value after the user pauses typing. */
export function SearchInput({
  value,
  onChange,
  placeholder = "جستجو...",
  className,
  delay = 350,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}) {
  const [text, setText] = useState(value);
  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(t);
  }, [text, value, onChange, delay]);

  return (
    <label className={cn("relative block min-w-0", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-line bg-field pr-11 pl-4 text-[14px] text-ink outline-none transition focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
      />
    </label>
  );
}

/** Pill buttons for a status filter, each with its count. */
export function FilterChips({
  value,
  onChange,
  options,
  allLabel = "همه",
  total,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count?: number }[];
  allLabel?: string;
  total?: number;
}) {
  const chip = (v: string, label: string, count?: number) => (
    <button
      key={v || "all"}
      type="button"
      onClick={() => onChange(v)}
      aria-pressed={value === v}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[13.5px] font-bold transition",
        value === v ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink hover:border-brand-500/40",
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("tabular rounded-md px-1.5 text-[12px]", value === v ? "bg-white/20" : "bg-field text-muted")}>{faNumber(count)}</span>
      )}
    </button>
  );
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {chip("", allLabel, total)}
      {options.map((o) => chip(o.value, o.label, o.count))}
    </div>
  );
}

export interface DateRange {
  from: string;
  to: string;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Range of the last `days` days, ending today. */
export function lastDays(days: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: iso(from), to: iso(to) };
}

const PRESETS = [
  { days: 7, label: "۷ روز" },
  { days: 30, label: "۳۰ روز" },
  { days: 90, label: "۹۰ روز" },
  { days: 365, label: "یک سال" },
];

/** Preset ranges plus a custom from / to pair. An empty range means "all time" where `allowAll` is set. */
export function DateRangePicker({ value, onChange, allowAll }: { value: DateRange; onChange: (r: DateRange) => void; allowAll?: boolean }) {
  const active = PRESETS.find((p) => {
    const r = lastDays(p.days);
    return r.from === value.from && r.to === value.to;
  });
  const input =
    "h-10 w-[150px] rounded-xl border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-brand-500/50 [color-scheme:inherit]";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/85">
        <CalendarDays className="size-4" />
        بازه زمانی
      </span>
      <div className="flex rounded-xl border border-line bg-surface p-1">
        {allowAll && (
          <button
            type="button"
            onClick={() => onChange({ from: "", to: "" })}
            className={cn("h-8 rounded-lg px-3 text-[13px] font-bold", !value.from && !value.to ? "bg-brand-600 text-white" : "text-ink hover:bg-field")}
          >
            همه
          </button>
        )}
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => onChange(lastDays(p.days))}
            className={cn("h-8 rounded-lg px-3 text-[13px] font-bold", active?.days === p.days ? "bg-brand-600 text-white" : "text-ink hover:bg-field")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-[13px] text-muted">
        از
        <input type="date" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} className={input} dir="ltr" />
      </label>
      <label className="flex items-center gap-1.5 text-[13px] text-muted">
        تا
        <input type="date" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} className={input} dir="ltr" />
      </label>
    </div>
  );
}

/** "Export to Excel" button with a busy state. */
export function ExportButton({ onExport, label = "خروجی اکسل" }: { onExport: () => Promise<void> | void; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onExport();
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-[13.5px] font-bold text-ink transition hover:border-brand-500/40 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {label}
    </button>
  );
}
