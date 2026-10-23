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
  // "این هفته" rows use the compact card beside its poster; every other row the poster card.
  const compact = section.section === "this-week";
  const variant = compact ? "compact" : "poster";
  const headingId = `home-section-${section.id}`;
  const itemClass = compact ? "w-[86%] min-[520px]:w-[60%] md:w-[46%] lg:w-[calc((100%-24px)/3)]" : "w-[46%] min-[520px]:w-[34%] md:w-[31%] lg:w-[calc((100%-36px)/4)]";

  return (
    <SectionCard title={section.title} subtitle={section.subtitle} headingId={headingId} moreHref={sectionHref(section)}>
      {isError ? (
        <ErrorState onRetry={() => refetch()} className="border-0" />
      ) : isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`shrink-0 ${itemClass}`}>
              <EventCardSkeleton variant={variant} />
            </div>
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState className="border-0" message={city ? `در حال حاضر رویدادی برای ${city.name} وجود ندارد.` : "در حال حاضر رویدادی برای نمایش وجود ندارد."} />
      ) : (
        <Carousel label={section.title} itemClassName={itemClass}>
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
  if (isLoading) return <Skeleton className="h-[320px] rounded-2xl" />;
  return (
    <>
      {data?.map((section, i) => (
        <EventRow key={section.id} section={section} index={i} />
      ))}
    </>
  );
}
