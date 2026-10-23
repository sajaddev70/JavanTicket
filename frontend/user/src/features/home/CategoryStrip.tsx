"use client";

import { useCategories } from "@/hooks/useContent";
import { CategoryChip } from "@/components/shared/CategoryChip";
import { ErrorState } from "@/components/feedback/States";
import { Skeleton } from "@/components/ui/Skeleton";

/** Home categories: one horizontally scrolling row of pastel tiles in each category's admin-defined color. */
export function CategoryStrip() {
  const { data, isLoading, isError, refetch } = useCategories();
  if (!isLoading && !isError && !data?.length) return null;

  return (
    <section aria-label="دسته‌بندی رویدادها" className="card px-1.5 py-3.5 sm:px-4">
      {isError ? (
        <ErrorState message="دریافت دسته‌بندی‌ها با خطا مواجه شد." onRetry={() => refetch()} className="border-0" />
      ) : (
        <ul className="no-scrollbar flex gap-1.5 overflow-x-auto px-1 lg:justify-between lg:gap-3">
          {isLoading
            ? Array.from({ length: 7 }, (_, i) => (
                <li key={i} className="flex w-[64px] shrink-0 flex-col items-center gap-2">
                  <Skeleton className="size-[54px] rounded-2xl" />
                  <Skeleton className="h-3 w-12" />
                </li>
              ))
            : data!.map((c) => (
                <li key={c.id} className="shrink-0">
                  <CategoryChip category={c} href={`/events?category=${encodeURIComponent(c.slug)}`} />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
