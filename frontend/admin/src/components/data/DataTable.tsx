'use client';

import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/cn";

export interface DataColumn<T> {
  key: string;
  label: string;
  render: (row: T, index: number) => React.ReactNode;
  /** Centered column (numbers, statuses). */
  center?: boolean;
  className?: string;
  /** Left out of the phone card (e.g. the row number). */
  hideOnMobile?: boolean;
}

/**
 * Table on desktop, stacked cards on phones, with loading / error / empty states.
 * The first column is the card title on phones; `actions` render in the last column and the card footer.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyMessage,
  actions,
  minWidth = 900,
  onRowClick,
}: {
  columns: DataColumn<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage: string;
  actions?: (row: T) => React.ReactNode;
  minWidth?: number;
  onRowClick?: (row: T) => void;
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && !rows?.length) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!rows?.length) return <EmptyState message={emptyMessage} />;

  const mobileColumns = columns.filter((c) => !c.hideOnMobile);
  const [title, ...details] = mobileColumns;

  return (
    <div className={cn(loading && "opacity-60 transition-opacity")}>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-right text-[13.5px]" style={{ minWidth }}>
          <thead>
            <tr className="bg-surface-2 text-[13px] text-ink">
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  className={cn("h-12 whitespace-nowrap px-3 font-bold", c.center && "text-center", i === 0 && "rounded-r-xl", !actions && i === columns.length - 1 && "rounded-l-xl")}
                >
                  {c.label}
                </th>
              ))}
              {actions && <th className="h-12 rounded-l-xl px-3 text-center font-bold">عملیات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70 text-ink">
            {rows.map((row, ri) => (
              <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn("hover:bg-field/40", onRowClick && "cursor-pointer")}>
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-3", c.center && "text-center", c.className)}>
                    {c.render(row, ri)}
                  </td>
                ))}
                {actions && (
                  <td className="px-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {rows.map((row, ri) => (
          <li key={rowKey(row)} className="rounded-xl border border-line/80 p-3">
            <div className={cn("font-bold text-ink", onRowClick && "cursor-pointer")} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {title.render(row, ri)}
            </div>
            {details.length > 0 && (
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
                {details.map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-muted">{c.label}</dt>
                    <dd className="min-w-0 break-words text-ink">{c.render(row, ri)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actions && <div className="mt-2 flex items-center justify-end gap-1 border-t border-line/60 pt-2">{actions(row)}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Square icon button used in table action columns. */
export function IconButton({
  label,
  onClick,
  children,
  tone = "brand",
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "brand" | "danger" | "success" | "muted";
  disabled?: boolean;
}) {
  const tones = {
    brand: "text-brand-600 hover:bg-brand-500/10",
    danger: "text-danger-fg hover:bg-danger/10",
    success: "text-success-fg hover:bg-success/10",
    muted: "text-muted hover:bg-field hover:text-ink",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40", tones[tone])}
    >
      {children}
    </button>
  );
}
