"use client";

import { useHomeSections } from "@/hooks/useContent";
import { useEventList } from "@/features/events/hooks";
import { SectionCard } from "@/components/shared/SectionCard";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { Carousel } from "@/components/ui/Carousel";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCity } from "@/providers/CityProvider";
import { useCities } from "@/hooks/useContent";
import type { HomeSection } from "@/types/content";

/** Link to the events page with the same filter as a homepage row. */
export function sectionHref(section: HomeSection): string {
  const params = new URLSearchParams();
  if (section.section === "featured" || section.section === "popular") params.set("type", section.section);
  if (section.section === "this-week") params.set("when", "week");
  if (section.section === "latest") params.set("sort", "newest");
  if (section.category_slug) params.set("category", section.category_slug);
  return `/events${params.size ? `?${params}` : ""}`;
}

function EventRow({ section, index }: { section: HomeSection; index: number }) {
  const { cityId } = useCity();
  const city = useCities().data?.find((c) => c.id === cityId);
  const { data, isLoading, isError, refetch } = useEventList({ section: section.section, category: section.category_slug, limit: section.item_limit });
  const compact = section.section === "this-week";
  const variant = compact ? "compact" : "featured";
  const headingId = `home-section-${section.id}`;

  return (
    <SectionCard title={section.title} subtitle={section.subtitle} headingId={headingId} moreHref={sectionHref(section)}>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <EventCardSkeleton key={i} variant={variant} />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState message={city ? `در حال حاضر رویدادی برای ${city.name} وجود ندارد.` : "در حال حاضر رویدادی برای نمایش وجود ندارد."} />
      ) : (
        <Carousel label={section.title} itemClassName={compact ? "w-[86%] sm:w-[48%] lg:w-[calc((100%-48px)/4)]" : "w-[90%] sm:w-[48%] xl:w-[calc((100%-48px)/4)]"}>
          {data.map((event, i) => (
            <EventCard key={event.id} event={event} variant={variant} priority={index === 0 && i < 2} />
          ))}
        </Carousel>
      )}
    </SectionCard>
  );
}

/** Event rows configured in the admin panel ("بخش‌های صفحه اصلی"), each narrowed to the header city. */
export function HomeEventSections() {
  const { data, isLoading, isError, refetch } = useHomeSections();
  if (isError) return <ErrorState message="دریافت بخش‌های صفحه اصلی با خطا مواجه شد." onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-[260px] rounded-[18px]" />;
  return (
    <>
      {data?.map((section, i) => (
        <EventRow key={section.id} section={section} index={i} />
      ))}
    </>
  );
}
