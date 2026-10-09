'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useCityStatus } from "@/hooks/useDashboard";
import { cn } from "@/lib/cn";
import { faNumber, faPercent } from "@/lib/format";
import { occupancyLevel, occupancyStyles } from "@/lib/occupancy";
import { CityMap } from "./CityMap";

const VISIBLE_CITIES = 5;

export function CityStatusCard() {
  const { data, isLoading, isError, refetch } = useCityStatus();
  const listed = data?.slice(0, VISIBLE_CITIES) ?? [];

  return (
    <Card className="p-5">
      <CardHeader
        title="وضعیت شهرها"
        action={
          <Link href="/cities" className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
            مشاهده همه شهرها
            <ArrowLeft className="size-4" />
          </Link>
        }
      />

      {isError ? (
        <ErrorState message="دریافت وضعیت شهرها با خطا مواجه شد." onRetry={() => refetch()} className="min-h-[300px]" />
      ) : !isLoading && listed.length === 0 ? (
        <EmptyState message="هنوز شهری ثبت نشده است." className="min-h-[300px]" />
      ) : (
        <div className="mt-4 grid grid-cols-1 items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <ul className="space-y-2.5">
            {isLoading
              ? Array.from({ length: VISIBLE_CITIES }, (_, i) => (
                  <li key={i} className="flex h-[58px] items-center justify-between rounded-xl bg-field/70 px-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3.5 w-16" />
                  </li>
                ))
              : listed.map((city) => {
                  const style = occupancyStyles[occupancyLevel(city.occupancyPercent)];
                  return (
                    <li
                      key={city.id}
                      className="flex min-h-[58px] items-center justify-between gap-3 rounded-xl border border-line/60 bg-surface-2 px-4 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("size-3 shrink-0 rounded-full ring-4", style.dot, style.ring)} />
                          <span className="truncate text-[14px] font-extrabold text-ink">{city.name}</span>
                        </div>
                        <p className="mt-1 pr-5 text-[12px] text-muted">{faNumber(city.activeEvents)} رویداد فعال</p>
                      </div>
                      <p className="shrink-0 text-[12px] text-muted">
                        ظرفیت{" "}
                        <span className={cn("text-[13px] font-extrabold", style.text)}>
                          {city.occupancyPercent === null ? "بدون سانس" : faPercent(city.occupancyPercent)}
                        </span>
                      </p>
                    </li>
                  );
                })}
          </ul>
          <div className="order-first sm:order-none">
            {isLoading ? <Skeleton className="mx-auto aspect-square w-full max-w-[340px] rounded-3xl" /> : <CityMap cities={data ?? []} />}
          </div>
        </div>
      )}
    </Card>
  );
}
