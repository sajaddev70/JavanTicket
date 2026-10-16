import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { faNumber } from "@/lib/format";

/** Page numbers with gaps: 1 … 4 5 [6] 7 8 … 30. RTL: "previous" sits on the right. */
export function Pagination({ page, pages, onChange, className }: { page: number; pages: number; onChange: (page: number) => void; className?: string }) {
  if (pages <= 1) return null;
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1 || (page <= 3 && n <= 4) || (page >= pages - 2 && n >= pages - 3));
  const item = "flex size-11 items-center justify-center rounded-xl border text-[14px] font-bold transition sm:size-10";
  return (
    <nav aria-label="صفحه‌بندی" className={cn("flex items-center justify-center gap-1.5", className)}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="صفحه قبل" className={cn(item, "border-line bg-surface text-ink-2 hover:border-brand-500/40 disabled:opacity-40")}>
        <ChevronRight className="size-4" />
      </button>
      {numbers.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - numbers[i - 1] > 1 && <span className={cn(item, "border-line bg-surface text-muted")} aria-hidden>…</span>}
          <button
            type="button"
            onClick={() => onChange(n)}
            aria-label={`صفحه ${faNumber(n)}`}
            aria-current={n === page ? "page" : undefined}
            className={cn(item, n === page ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink hover:border-brand-500/40")}
          >
            {faNumber(n)}
          </button>
        </span>
      ))}
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="صفحه بعد" className={cn(item, "border-line bg-surface text-ink-2 hover:border-brand-500/40 disabled:opacity-40")}>
        <ChevronLeft className="size-4" />
      </button>
    </nav>
  );
}
