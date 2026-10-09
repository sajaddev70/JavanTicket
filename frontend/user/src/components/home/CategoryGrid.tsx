'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "@/hooks/usePublicData";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { faNumber } from "@/lib/format";

export function CategoryGrid() {
  const { data, isLoading, isError, refetch } = useCategories();
  if (isError) return <ErrorState message="دریافت دسته‌بندی‌ها با خطا مواجه شد." onRetry={() => refetch()} />;
  if (!isLoading && !data?.length) return null;

  return (
    <section aria-labelledby="categories-title" className="rounded-[20px] border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="categories-title" className="text-[20px] font-black text-ink sm:text-[22px]">
          دسته‌بندی رویدادها
        </h2>
        <Link href="/events" className="flex items-center gap-1.5 text-[13.5px] font-bold text-brand-600 hover:text-brand-700">
          مشاهده همه دسته‌بندی‌ها
          <ArrowLeft className="size-4" />
        </Link>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:auto-cols-fr lg:grid-flow-col lg:overflow-visible">
        {isLoading
          ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[118px] w-[128px] shrink-0 rounded-2xl lg:w-auto" />)
          : data!.map((c) => {
              const color = c.color ?? "#2f80f5";
              return (
                <Link
                  key={c.id}
                  href={`/events?category=${encodeURIComponent(c.slug)}`}
                  className="flex h-[118px] w-[128px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl text-center transition hover:-translate-y-0.5 hover:shadow-card lg:w-auto"
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 9%, var(--surface))` }}
                >
                  <span className="flex size-11 items-center justify-center rounded-xl" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, var(--surface))` }}>
                    <SvgIcon src={c.icon_url} className="size-7" />
                  </span>
                  <span className="text-[14px] font-extrabold text-ink">{c.name}</span>
                  <span className="text-[12px] text-muted">{faNumber(c.events_count)} رویداد</span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
