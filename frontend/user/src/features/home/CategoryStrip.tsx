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
    <section aria-label="دسته‌بندی رویدادها">
      {isError ? (
        <ErrorState message="دریافت دسته‌بندی‌ها با خطا مواجه شد." onRetry={() => refetch()} className="border-0" />
      ) : (
        <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0 lg:justify-between lg:gap-3">
          {isLoading
            ? Array.from({ length: 7 }, (_, i) => (
                <li key={i} className="shrink-0">
                  <Skeleton className="h-[100px] w-[84px] rounded-[20px] sm:h-[104px] sm:w-[92px]" />
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
