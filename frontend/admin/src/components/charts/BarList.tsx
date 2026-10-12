import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { faNumber, faPercent } from '@/lib/format';

export interface BarItem {
  key: string | number;
  label: string;
  value: number;
  /** Secondary text under the label, e.g. "۱۲۰ سفارش". */
  hint?: string;
  /** Optional identity color (e.g. the category color) shown as a dot. */
  dot?: string | null;
}

/**
 * Ranked horizontal bars in one hue: label, bar (share of the largest) and value, readable without color.
 * Each row has a title tooltip with the exact value.
 */
export function BarList({ items, format = faNumber, loading, emptyMessage = 'داده‌ای برای نمایش نیست.', showShare = true }: {
  items?: BarItem[];
  format?: (v: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  showShare?: boolean;
}) {
  if (loading) return <Skeleton className="h-48 rounded-xl" />;
  if (!items?.length) return <EmptyState message={emptyMessage} />;
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((a, b) => a + b.value, 0);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key} title={`${i.label}: ${format(i.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 font-bold text-ink">
              {i.dot && <span className="size-2.5 shrink-0 rounded-full" style={{ background: i.dot }} />}
              <span className="truncate">{i.label}</span>
              {i.hint && <span className="shrink-0 text-[12px] font-normal text-muted">{i.hint}</span>}
            </span>
            <span className="tabular shrink-0 text-ink">
              {format(i.value)}
              {showShare && total > 0 && <span className="mr-1.5 text-[12px] text-muted">({faPercent((i.value * 100) / total)})</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-field">
            <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${Math.max(2, (i.value * 100) / max)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
