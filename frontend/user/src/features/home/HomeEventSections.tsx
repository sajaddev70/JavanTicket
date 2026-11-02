"use client";

import { useHomeSections } from "@/hooks/useContent";
import { useEventList } from "@/features/events/hooks";
import { SectionCard } from "@/components/shared/SectionCard";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { LoadingOverlay, SYMBOL } from "@/components/feedback/StateDialog";
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

const MAX_ROW_EVENTS = 4;

function EventRow({ section, index }: { section: HomeSection; index: number }) {
  const { cityId } = useCity();
  const city = useCities().data?.find((c) => c.id === cityId);
  const { data, isLoading, isError, refetch } = useEventList({ section: section.section, category: section.category_slug, limit: section.item_limit });
  const headingId = `home-section-${section.id}`;

  return (
    <SectionCard title={section.title} subtitle={section.subtitle} headingId={headingId} moreHref={sectionHref(section)}>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-[11px] lg:grid-cols-2">
          {[0, 1].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-[12px] leading-[2] text-muted">{city ? `در حال حاضر رویدادی برای ${city.name} وجود ندارد.` : "در حال حاضر رویدادی برای نمایش وجود ندارد."}</p>
      ) : (
        <div className="grid gap-[11px] lg:grid-cols-2">
          {data.slice(0, MAX_ROW_EVENTS).map((event, i) => (
            <EventCard key={event.id} event={event} priority={index === 0 && i < 2} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/** Event rows configured in the admin panel ("بخش‌های صفحه اصلی"), each narrowed to the header city. */
export function HomeEventSections() {
  const { data, isLoading, isError, refetch } = useHomeSections();
  if (isError) return <ErrorState message="دریافت بخش‌های صفحه اصلی با خطا مواجه شد." onRetry={() => refetch()} />;
  if (isLoading) return <LoadingOverlay title="در حال دریافت اطلاعات" message="رویدادها در حال بارگذاری هستند." />;
  if (!data?.length) {
    return <EmptyState message="رویدادی برای نمایش نیست" description="به‌زودی رویدادهای تازه اضافه می‌شوند." symbol={SYMBOL.calendar} action={<ButtonLink href="/events" size="xl">مشاهده رویدادها</ButtonLink>} />;
  }
  return (
    <>
      {data.map((section, i) => (
        <EventRow key={section.id} section={section} index={i} />
      ))}
    </>
  );
}
