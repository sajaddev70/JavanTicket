import { ChevronLeft, ChevronRight } from "lucide-react";
import { faNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Page numbers (with ellipsis), "showing x to y of z" and an optional page-size picker. */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  unit,
  sizes = [8, 10, 20, 50],
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  unit: string;
  sizes?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);

  const btn = "flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-[14px] font-bold text-ink transition hover:border-brand-500/40 disabled:opacity-40 disabled:hover:border-line";
  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 px-1 pt-4 sm:flex-row">
      <nav className="flex items-center gap-1.5" aria-label="صفحه‌بندی">
        <button type="button" className={btn} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="صفحه قبل">
          <ChevronRight className="size-4" />
        </button>
        {numbers.map((n, i) => (
          <span key={n} className="flex items-center gap-1.5">
            {i > 0 && n - numbers[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
            <button
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(btn, n === page && "border-brand-600 bg-brand-600 text-white hover:border-brand-600")}
            >
              {faNumber(n)}
            </button>
          </span>
        ))}
        <button type="button" className={btn} onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="صفحه بعد">
          <ChevronLeft className="size-4" />
        </button>
      </nav>
      <div className="flex items-center gap-3 text-[13px] text-muted">
        <span>
          نمایش {faNumber(from)} تا {faNumber(to)} از {faNumber(total)} {unit}
        </span>
        {onPageSize && (
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">در هر صفحه</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-[13px] font-semibold text-ink outline-none focus:border-brand-500/50"
            >
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {faNumber(s)} مورد
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

/** Rows of the current page. */
export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  return rows.slice((page - 1) * pageSize, page * pageSize);
}
