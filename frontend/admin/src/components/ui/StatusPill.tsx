import { cn } from "@/lib/cn";

export type Tone = "success" | "brand" | "warning" | "danger" | "muted" | "purple";

const TONES: Record<Tone, { box: string; dot: string }> = {
  success: { box: "bg-success/10 text-success-fg border-success/20", dot: "bg-success" },
  brand: { box: "bg-brand-500/10 text-brand-600 border-brand-500/20", dot: "bg-brand-500" },
  warning: { box: "bg-warning/12 text-warning-fg border-warning/25", dot: "bg-warning" },
  danger: { box: "bg-danger/10 text-danger-fg border-danger/20", dot: "bg-danger" },
  muted: { box: "bg-surface-2 text-muted border-line", dot: "bg-muted/60" },
  purple: { box: "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-300", dot: "bg-violet-500" },
};

/** Rounded status label with a leading dot, as used in every table of the designs. */
export function StatusPill({ tone, children, dot = true, className }: { tone: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  const t = TONES[tone];
  return (
    <span className={cn("inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-[12.5px] font-bold", t.box, className)}>
      {dot && <span className={cn("size-2.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

/** Label + tone for each status value of a table column. */
export type StatusMap = Record<string, { label: string; tone: Tone }>;

export function statusOf(map: StatusMap, value: unknown) {
  return map[String(value)] ?? { label: String(value ?? "—"), tone: "muted" as Tone };
}
