'use client';

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEvents } from "@/hooks/usePublicData";
import { EmptyState, ErrorState } from "@/components/ui/States";
import type { HomeSection } from "@/services/public";
import { EventCard, EventCardSkeleton } from "./EventCard";

/** One event row of the homepage (configured in the admin panel), shown as a carousel. */
export function EventSection({ section, highlight }: { section: HomeSection; highlight?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useEvents({
    section: section.section,
    category: section.category_slug,
    limit: section.item_limit,
  });
  const params = new URLSearchParams();
  if (section.section && section.section !== "latest") params.set("section", section.section);
  if (section.category_slug) params.set("category", section.category_slug);
  const headingId = `section-${section.id}`;
  // RTL: scrollLeft is negative, so "next" (towards the left) is a negative offset.
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: -dir * (track.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <section aria-labelledby={headingId} className="rounded-[20px] border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="flex items-center gap-2 text-[20px] font-black text-ink sm:text-[22px]">
            {highlight && <Star className="size-6 text-warning" />}
            {section.title}
          </h2>
          {section.subtitle && <p className="mt-1 text-[13px] text-muted">{section.subtitle}</p>}
        </div>
        <Link href={`/events${params.size ? `?${params}` : ""}`} className="flex shrink-0 items-center gap-1.5 text-[13.5px] font-bold text-brand-600 hover:text-brand-700">
          مشاهده همه رویدادها
          <ArrowLeft className="size-4" />
        </Link>
      </div>

      {isError ? (
        <ErrorState message="دریافت رویدادها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : !isLoading && !data?.length ? (
        <EmptyState message="در حال حاضر رویدادی برای نمایش وجود ندارد." />
      ) : (
        <div className="relative">
          <div ref={track} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2">
            {(isLoading ? Array.from({ length: 4 }, () => null) : data!).map((event, i) => (
              <div key={event?.id ?? i} className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3*16px)/4)]">
                {event ? <EventCard event={event} variant="home" /> : <EventCardSkeleton />}
              </div>
            ))}
          </div>
          {!isLoading && (data?.length ?? 0) > 4 && (
            <>
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label="قبلی"
                className="absolute -right-8 top-[22%] hidden size-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-float hover:text-brand-600 lg:flex"
              >
                <ChevronRight className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label="بعدی"
                className="absolute -left-8 top-[22%] hidden size-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-float hover:text-brand-600 lg:flex"
              >
                <ChevronLeft className="size-5" />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
