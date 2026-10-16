import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Option {
  value: string | number;
  label: string;
}

/** Select used in the filter bars, optionally with a label and a leading icon above it. */
export function FilterSelect({
  label,
  icon,
  value,
  onChange,
  options,
  allLabel,
  className,
}: {
  label?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  allLabel: string;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      {label && (
        <span className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink/85">
          {icon}
          {label}
        </span>
      )}
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label ?? allLabel}
          className="h-12 w-full appearance-none truncate rounded-xl border border-line bg-surface pr-4 pl-10 text-[14px] font-semibold text-ink outline-none transition focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10"
        >
          <option value="">{allLabel}</option>
          {options.map((o) => (
            <option key={o.value} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </span>
    </label>
  );
}
