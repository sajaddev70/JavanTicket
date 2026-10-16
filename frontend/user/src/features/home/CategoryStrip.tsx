"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useContent";
import { SectionCard } from "@/components/shared/SectionCard";
import { ErrorState } from "@/components/feedback/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

/** "دسته‌بندی رویدادها": pastel tiles in each category's admin-defined color. */
export function CategoryStrip() {
  const { data, isLoading, isError, refetch } = useCategories();
  if (!isLoading && !isError && !data?.length) return null;

  return (
    <SectionCard title="دسته‌بندی رویدادها" headingId="home-categories" moreHref="/events">
      {isError ? (
        <ErrorState message="دریافت دسته‌بندی‌ها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : (
        <ul className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:auto-cols-fr lg:grid-flow-col lg:overflow-visible">
          {isLoading
            ? Array.from({ length: 9 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-[96px] w-[112px] rounded-2xl lg:h-[88px] lg:w-auto" />
                </li>
              ))
            : data!.map((c) => {
                const color = c.color ?? "#2f80f5";
                return (
                  <li key={c.id} className="shrink-0">
                    <Link
                      href={`/events?category=${encodeURIComponent(c.slug)}`}
                      className="group flex h-[96px] w-[112px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 text-center transition hover:-translate-y-0.5 lg:h-[88px] lg:w-full"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 10%, var(--surface))` }}
                    >
                      <span style={{ color }}>
                        <CategoryIcon slug={c.slug} iconUrl={c.icon_url} className="size-8" />
                      </span>
                      <span className="line-clamp-2 text-[12.5px] font-bold leading-5 text-ink lg:line-clamp-1 lg:text-[13px]">{c.name}</span>
                    </Link>
                  </li>
                );
              })}
        </ul>
      )}
    </SectionCard>
  );
}
