"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { useFavoriteToggle } from "@/features/profile/queries";
import { faDateRange, faFullDate, faNumber, faTime, sameDay } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PublicEvent } from "@/types/event";

export function eventWhen(e: PublicEvent): { date: string; time?: string } {
  if (e.start_date && e.end_date && !sameDay(e.start_date, e.end_date)) {
    return { date: faDateRange(e.start_date, e.end_date), time: e.next_session_at ? faTime(e.next_session_at) : undefined };
  }
  const at = e.next_session_at ?? e.start_date;
  return at ? { date: faFullDate(at), time: faTime(at) } : { date: "زمان به‌زودی اعلام می‌شود" };
}

export function eventPlace(e: PublicEvent, separator = "، "): string {
  return [e.city_name, e.hall_name ?? e.venue_name].filter(Boolean).join(separator);
}

export function FavoriteButton({ event, className }: { event: PublicEvent; className?: string }) {
  const { isFavorite, toggle } = useFavoriteToggle();
  const on = isFavorite(event.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(event.id);
      }}
      aria-pressed={on}
      aria-label={on ? `حذف ${event.title} از علاقه‌مندی‌ها` : `افزودن ${event.title} به علاقه‌مندی‌ها`}
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-[2px] transition hover:bg-black/45", className)}
    >
      <Heart className={cn("size-[17px]", on && "fill-ticket text-ticket")} strokeWidth={2} />
    </button>
  );
}

/** "از ۱۵۰٬۰۰۰ تومان" in the design's .price; "رایگان" for free events. */
export function Price({ event, className }: { event: PublicEvent; className?: string }) {
  const price = Number(event.min_price ?? 0);
  if (!price) return <span className={cn("text-[13px] font-black text-success-fg", className)}>{event.min_price === 0 ? "رایگان" : ""}</span>;
  return <span className={cn("whitespace-nowrap text-[13px] font-black text-brand-600", className)}>از {faNumber(price)} تومان</span>;
}

/**
 * The design's .event: a light card with the poster, title, date and place. The same card appears on the home, events,
 * favorites, tickets, checkout, payment and order screens; [children] is what differs (price, seat ...).
 */
export function EventSummaryCard({
  banner,
  fallback,
  title,
  date,
  place,
  href,
  overlay,
  priority,
  className,
  children,
}: {
  banner?: string | null;
  fallback?: string | null;
  title: string;
  date: string;
  place?: string;
  href?: string;
  overlay?: React.ReactNode;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className={cn("on-light group relative flex min-h-[113px] items-center gap-3 rounded-[17px] bg-surface p-2.5 shadow-[0_8px_18px_rgb(0_0_0/0.13)]", className)}>
      <div className="bg-thumb relative h-[94px] w-[104px] shrink-0 overflow-hidden rounded-[13px]">
        <SmartImage src={mediaUrl(banner)} fallback={mediaUrl(fallback)} alt={title} fill preload={priority} sizes="104px" className="object-cover" />
        {overlay}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.7] text-ink">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 after:rounded-[17px]">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted">
          <Icon name="common/clock" className="size-3 shrink-0" />
          <span className="truncate">{date}</span>
        </p>
        {place && (
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted">
            <Icon name="common/location" className="size-3 shrink-0" />
            <span className="truncate">{place}</span>
          </p>
        )}
        {children && <div className="mt-1">{children}</div>}
      </div>
    </article>
  );
}

export function EventCard({ event, priority }: { event: PublicEvent; priority?: boolean }) {
  return (
    <EventSummaryCard
      banner={event.banner_url}
      fallback={event.category_cover_url}
      title={event.title}
      date={eventWhen(event).date}
      place={eventPlace(event)}
      href={`/events/${encodeURIComponent(event.slug)}`}
      priority={priority}
      overlay={<FavoriteButton event={event} className="absolute left-1 top-1 z-[2]" />}
    >
      <Price event={event} />
    </EventSummaryCard>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="flex min-h-[113px] items-center gap-3 rounded-[17px] bg-surface p-2.5" aria-hidden>
      <Skeleton className="h-[94px] w-[104px] shrink-0 rounded-[13px]" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-2.5 w-3/5" />
        <Skeleton className="h-2.5 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}
