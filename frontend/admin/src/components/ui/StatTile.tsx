import { ArrowDown, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/SvgIcon";
import { faPercent } from "@/lib/format";
import { cn } from "@/lib/cn";

const TILE: Record<string, string> = {
  green: "bg-[#22c55e]",
  blue: "bg-[#2f80f5]",
  orange: "bg-[#f5a524]",
  red: "bg-[#f25f6b]",
  purple: "bg-[#8b5cf6]",
};

/** Summary card: title, big value, unit and change vs. the previous period, with a colored icon tile. */
export function StatTile({
  title,
  value,
  unit,
  icon,
  color,
  changePercent,
  compareLabel = "نسبت به ماه قبل",
  loading,
}: {
  title: string;
  value?: string;
  unit: string;
  icon: string;
  color: keyof typeof TILE;
  changePercent?: number | null;
  compareLabel?: string;
  loading?: boolean;
}) {
  const up = (changePercent ?? 0) >= 0;
  return (
    <article className="flex min-h-[150px] items-start justify-between gap-3 rounded-2xl border border-line/70 bg-surface p-5 shadow-card">
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {loading ? (
          <>
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-3 h-3.5 w-20" />
          </>
        ) : (
          <>
            <p className={cn("tabular mt-3 whitespace-nowrap font-black leading-none text-ink", (value?.length ?? 0) > 11 ? "text-[clamp(20px,1.6vw,26px)]" : "text-[clamp(24px,2.2vw,34px)]")}>
              {value ?? "—"}
            </p>
            <p className="mt-2 text-[13px] text-muted">{unit}</p>
            <p className="mt-3 flex items-center gap-1 text-[13px] text-muted">
              {changePercent !== null && changePercent !== undefined ? (
                <>
                  <span className={cn("flex items-center gap-0.5 font-bold", up ? "text-success" : "text-danger")}>
                    {up ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                    {faPercent(Math.abs(changePercent))}
                  </span>
                  {compareLabel}
                </>
              ) : (
                <span className="text-muted/80">بدون داده برای مقایسه</span>
              )}
            </p>
          </>
        )}
      </div>
      <span className={cn("flex size-[68px] shrink-0 items-center justify-center rounded-2xl text-white shadow-sm", TILE[color])}>
        <Icon name={icon} className="size-8" />
      </span>
    </article>
  );
}
