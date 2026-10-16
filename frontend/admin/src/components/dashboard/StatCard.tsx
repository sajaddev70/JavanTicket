import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { asset } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { faPercent } from "@/lib/format";

export interface StatCardProps {
  title: string;
  /** Already formatted value; undefined while loading. */
  value?: string;
  unit: string;
  iconSrc: string;
  changePercent?: number | null;
  compareLabel: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function StatCard({ title, value, unit, iconSrc, changePercent, compareLabel, isLoading, isError }: StatCardProps) {
  const up = (changePercent ?? 0) >= 0;
  return (
    <article className="flex min-h-[150px] items-start justify-between gap-3 rounded-2xl border border-line/70 bg-surface p-5 shadow-card">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {isLoading ? (
          <>
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2.5 h-3.5 w-14" />
            <Skeleton className="mt-4 h-3.5 w-28" />
          </>
        ) : (
          <>
            <p className="tabular mt-3 whitespace-nowrap text-[clamp(22px,1.9vw,32px)] font-black leading-none text-ink" dir="rtl">
              {isError ? "—" : value}
            </p>
            <p className="mt-2 text-[13px] text-muted">{unit}</p>
            <p className="mt-3 flex items-center gap-1 text-[13px] text-muted">
              {changePercent !== null && changePercent !== undefined && !isError ? (
                <>
                  <span className={cn("flex items-center gap-0.5 font-bold", up ? "text-success" : "text-danger")}>
                    {up ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                    {faPercent(Math.abs(changePercent))}
                  </span>
                  <span>{compareLabel}</span>
                </>
              ) : (
                <span className="text-muted/80">{isError ? "خطا در دریافت" : "بدون داده برای مقایسه"}</span>
              )}
            </p>
          </>
        )}
      </div>
      <Image
        src={asset(iconSrc)}
        alt=""
        width={68}
        height={68}
        className="size-14 shrink-0 object-contain xl:size-[68px]"
      />
    </article>
  );
}
