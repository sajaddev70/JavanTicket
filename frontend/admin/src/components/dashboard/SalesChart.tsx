'use client';

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useSalesChart } from "@/hooks/useDashboard";
import { faDayMonth, faMillions, faNumber, parseIsoDate } from "@/lib/format";
import type { SalesPoint } from "@/services/dashboard";

const RANGES = [
  { days: 7, label: "۷ روز گذشته" },
  { days: 30, label: "۳۰ روز گذشته" },
  { days: 90, label: "۹۰ روز گذشته" },
];

// Fixed skeleton silhouette (layout only, not data).
const SKELETON_BARS = [35, 48, 30, 55, 42, 60, 38, 52, 45, 66, 50, 58, 44, 70, 62, 54, 75, 60, 68, 80, 64, 72, 85, 78];

// CSS variables, so the chart follows the light/dark theme.
const BAR_COLOR = "var(--brand-500)";
const AVG_COLOR = "var(--danger)";
const GRID_COLOR = "var(--line)";
const TICK = { fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-iransans)" };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: SalesPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div dir="rtl" className="rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-float">
      <div className="mb-1 font-bold text-ink">{faDayMonth(parseIsoDate(point.date))}</div>
      <div className="flex items-center gap-1.5 text-muted">
        <span className="size-2 rounded-full" style={{ background: BAR_COLOR }} />
        فروش روزانه: <span className="font-semibold text-ink">{faNumber(point.amount)}</span> تومان
      </div>
      <div className="flex items-center gap-1.5 text-muted">
        <span className="size-2 rounded-full" style={{ background: AVG_COLOR }} />
        میانگین ۷ روزه: <span className="font-semibold text-ink">{faNumber(Math.round(point.movingAverage))}</span>
      </div>
    </div>
  );
}

export function SalesChart() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, refetch } = useSalesChart(days);
  const hasSales = data?.some((p) => p.amount > 0);

  return (
    <Card className="flex flex-col p-5">
      <CardHeader
        title="نمودار فروش"
        subtitle="مقایسه فروش روزانه (میلیون تومان)"
        action={
          <label className="relative flex h-10 items-center">
            <span className="sr-only">بازه زمانی</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-full appearance-none rounded-xl border border-line bg-surface pr-3.5 pl-9 text-[13px] font-semibold text-ink outline-none focus:border-brand-500/50"
            >
              {RANGES.map((r) => (
                <option key={r.days} value={r.days}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 size-4 text-muted" />
          </label>
        }
      />

      <div className="mt-4 h-[250px] sm:h-[270px]" dir="ltr">
        {isLoading ? (
          <div className="flex h-full items-end gap-1.5 px-8 pb-8">
            {SKELETON_BARS.map((h, i) => (
              <div key={i} className="flex-1" style={{ height: `${h}%` }}>
                <Skeleton className="h-full rounded-sm" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="دریافت نمودار فروش با خطا مواجه شد." onRetry={() => refetch()} className="h-full" />
        ) : !hasSales ? (
          <EmptyState message="در این بازه فروشی ثبت نشده است." className="h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid stroke={GRID_COLOR} vertical horizontal />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => faDayMonth(parseIsoDate(d))}
                interval={Math.max(0, Math.ceil((data?.length ?? 0) / 7) - 1)}
                tick={TICK}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
                height={36}
              />
              <YAxis
                tickFormatter={faMillions}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(47,128,245,0.06)" }} />
              <Bar dataKey="amount" fill={BAR_COLOR} radius={[2, 2, 0, 0]} maxBarSize={14} />
              <Line
                dataKey="movingAverage"
                type="monotone"
                stroke={AVG_COLOR}
                strokeWidth={2}
                dot={{ r: 2.5, fill: AVG_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-[13px] text-ink">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ background: BAR_COLOR }} />
          فروش روزانه
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ background: AVG_COLOR }} />
          میانگین ۷ روزه
        </span>
      </div>
    </Card>
  );
}
