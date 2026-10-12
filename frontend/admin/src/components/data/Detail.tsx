import { cn } from "@/lib/cn";

/** Label / value grid used in detail dialogs. */
export function DetailGrid({ items, className }: { items: [string, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border border-line/70 bg-surface-2/60 p-4 text-[13.5px] sm:grid-cols-2", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
          <dt className="shrink-0 text-muted">{label}</dt>
          <dd className="min-w-0 break-words font-bold text-ink sm:mt-1">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-5 flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-extrabold text-ink">{children}</h3>
      {action}
    </div>
  );
}
