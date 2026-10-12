'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { faCompact, faDayMonth, faNumber, parseIsoDate } from '@/lib/format';

export interface TrendSeries {
  key: string;
  label: string;
  /** CSS color, e.g. var(--series-1) */
  color: string;
}

const GRID = 'var(--line)';
const TICK = { fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-iransans)' };

function TrendTooltip({ active, payload, series, unit }: { active?: boolean; payload?: { payload: Record<string, number | string> }[]; series: TrendSeries[]; unit: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div dir="rtl" className="rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-float">
      <div className="mb-1 font-bold text-ink">{faDayMonth(parseIsoDate(String(point.date)))}</div>
      {series.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5 text-muted">
          <span className="size-2 rounded-full" style={{ background: s.color }} />
          {s.label}: <span className="tabular font-semibold text-ink">{faNumber(Number(point[s.key]))}</span> {unit}
        </div>
      ))}
    </div>
  );
}

/** Daily values over a date range on one shared axis, with a crosshair tooltip and a legend. */
export function TrendChart({
  data,
  series,
  unit,
  loading,
  height = 280,
}: {
  data?: Record<string, number | string>[];
  series: TrendSeries[];
  unit: string;
  loading?: boolean;
  height?: number;
}) {
  const empty = !data?.some((d) => series.some((s) => Number(d[s.key]) > 0));
  return (
    <div>
      <div style={{ height }} dir="ltr">
        {loading ? (
          <Skeleton className="h-full rounded-xl" />
        ) : empty ? (
          <EmptyState message="در این بازه داده‌ای ثبت نشده است." className="h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => faDayMonth(parseIsoDate(d))}
                interval={Math.max(0, Math.ceil((data?.length ?? 0) / 8) - 1)}
                tick={TICK}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                height={34}
              />
              <YAxis tickFormatter={(v: number) => faCompact(v)} tick={TICK} tickLine={false} axisLine={false} width={72} />
              <Tooltip content={<TrendTooltip series={series} unit={unit} />} cursor={{ stroke: 'var(--muted)', strokeDasharray: '4 4' }} />
              {series.map((s) => (
                <Line key={s.key} dataKey={s.key} type="monotone" stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      {series.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-[13px] text-ink">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className="h-0.5 w-5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
