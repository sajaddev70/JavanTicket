"use client";

import { useCategories } from "@/hooks/useContent";
import { CategoryChip } from "@/components/shared/CategoryChip";
import { SectionHeader } from "@/components/shared/SectionCard";
import { ErrorState } from "@/components/feedback/States";
import { Skeleton } from "@/components/ui/Skeleton";

/** "دسته‌بندی رویدادها": one scrolling row of chips with each category's admin-defined icon and color. */
export function CategoryStrip() {
  const { data, isLoading, isError, refetch } = useCategories();
  if (!isLoading && !isError && !data?.length) return null;

  return (
    <section aria-labelledby="home-categories">
      <SectionHeader title="دسته‌بندی رویدادها" headingId="home-categories" />
      {isError ? (
        <ErrorState message="دریافت دسته‌بندی‌ها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : (
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-10 w-24 rounded-full" />
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
