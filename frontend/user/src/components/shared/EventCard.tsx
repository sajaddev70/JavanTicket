"use client";

import Link from "next/link";
import { CalendarDays, Clock, Heart, MapPin } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFavoriteToggle } from "@/features/profile/queries";
import { faDateRange, faFullDate, faNumber, faTime, sameDay } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PublicEvent } from "@/types/event";

/**
 * Event card used across the site.
 * - featured: horizontal, poster on the start side (homepage "رویدادهای ویژه", payment result suggestions)
 * - grid: poster on top (events page)
 * - compact: small horizontal card (homepage "رویدادهای این هفته")
 * - row: wide horizontal card (events page, list view)
 */
export type EventCardVariant = "featured" | "grid" | "compact" | "row";

export function eventWhen(e: PublicEvent): { date: string; time?: string } {
  if (e.start_date && e.end_date && !sameDay(e.start_date, e.end_date)) {
    return { date: faDateRange(e.start_date, e.end_date), time: e.next_session_at ? faTime(e.next_session_at) : undefined };
  }
  const at = e.next_session_at ?? e.start_date;
  return at ? { date: faFullDate(at), time: faTime(at) } : { date: "زمان به‌زودی اعلام می‌شود" };
}

export function eventPlace(e: PublicEvent, separator = " - "): string {
  return [e.city_name, e.hall_name ?? e.venue_name].filter(Boolean).join(separator);
}

function FavoriteButton({ event, className }: { event: PublicEvent; className?: string }) {
  const { isFavorite, toggle } = useFavoriteToggle();
  const on = isFavorite(event.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle(event.id);
      }}
      aria-pressed={on}
      aria-label={on ? `حذف ${event.title} از علاقه‌مندی‌ها` : `افزودن ${event.title} به علاقه‌مندی‌ها`}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface/95 text-ink-2 shadow-sm transition hover:text-ticket",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", on && "fill-ticket text-ticket")} />
    </button>
  );
}

function Price({ event, className }: { event: PublicEvent; className?: string }) {
  const price = Number(event.min_price ?? 0);
  if (!price) return <span className={cn("text-[13px] font-bold text-success-fg", className)}>{event.min_price === 0 ? "رایگان" : ""}</span>;
  return (
    <span className={cn("whitespace-nowrap text-[13px] text-ink-2", className)}>
      از <b className="text-[14px] font-black text-brand-600">{faNumber(price)}</b> <b className="font-bold text-brand-600">تومان</b>
    </span>
  );
}

function Poster({ event, sizes, className, priority }: { event: PublicEvent; sizes: string; className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-field", className)}>
      <SmartImage
        src={mediaUrl(event.banner_url)}
        fallback={mediaUrl(event.category_cover_url)}
        alt={event.title}
        fill
        sizes={sizes}
        preload={priority}
        className="object-cover transition duration-500 group-hover:scale-[1.04]"
      />
    </div>
  );
}

export function EventCard({ event, variant = "grid", priority }: { event: PublicEvent; variant?: EventCardVariant; priority?: boolean }) {
  const href = `/events/${encodeURIComponent(event.slug)}`;
  const when = eventWhen(event);
  const place = eventPlace(event);

  if (variant === "compact") {
    return (
      <article className="group relative flex h-full gap-3 rounded-2xl border border-line bg-surface p-2.5 shadow-card transition hover:shadow-float">
        <Poster event={event} sizes="112px" className="h-[86px] w-[104px] shrink-0" priority={priority} />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-0.5">
          <h3 className="line-clamp-2 text-[14px] font-black leading-6 text-ink">
            <Link href={href} className="after:absolute after:inset-0 hover:text-brand-600">
              {event.title}
            </Link>
          </h3>
          {place && (
            <p className="flex items-center gap-1.5 text-[12px] text-muted">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{place}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="truncate">{when.date}</span>
          </p>
        </div>
      </article>
    );
  }

  if (variant === "featured" || variant === "row") {
    const row = variant === "row";
    return (
      <article className="group relative flex h-full gap-3.5 rounded-2xl border border-line bg-surface p-2.5 shadow-card transition hover:shadow-float">
        <Poster
          event={event}
          sizes={row ? "(min-width: 640px) 240px, 128px" : "128px"}
          className={cn("shrink-0", row ? "aspect-[4/3] w-32 sm:w-60" : "w-[118px] sm:w-[124px]")}
          priority={priority}
        />
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <div className="flex items-start gap-2">
            <h3 className="line-clamp-2 min-h-[2lh] flex-1 text-[15px] font-black leading-[1.6] text-ink">
              <Link href={href} className="hover:text-brand-600">
                {event.title}
              </Link>
            </h3>
            <FavoriteButton event={event} className="relative z-10 -mt-0.5" />
          </div>
          <ul className="mt-2 space-y-1.5 text-[12.5px] text-muted">
            {place && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" />
                <span className="truncate">{place}</span>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" />
              <span className="truncate">{when.date}</span>
            </li>
            {when.time && (
              <li className="flex items-center gap-1.5">
                <Clock className="size-4 shrink-0" />
                <span className="tabular">{when.time}</span>
              </li>
            )}
          </ul>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <Price event={event} />
            <Link href={href} className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-brand-600 px-4 text-[13px] font-bold text-white hover:bg-brand-700">
              خرید بلیت
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
      <div className="relative">
        <Poster event={event} sizes="(min-width: 1280px) 250px, (min-width: 768px) 33vw, (min-width: 520px) 50vw, 100vw" className="aspect-[16/10] rounded-none rounded-t-2xl" priority={priority} />
        <FavoriteButton event={event} className="absolute left-2.5 top-2.5 z-10" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-[15px] font-black leading-7 text-ink">
          <Link href={href} className="hover:text-brand-600">
            {event.title}
          </Link>
        </h3>
        {place && (
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{eventPlace(event, "  |  ")}</span>
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
          <CalendarDays className="size-4 shrink-0" />
          <span className="truncate">{when.date}</span>
          {when.time && (
            <>
              <Clock className="mr-auto size-4 shrink-0" />
              <span className="tabular shrink-0">{when.time}</span>
            </>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <Price event={event} />
          <Link href={href} className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-brand-600 px-3.5 text-[13px] font-bold text-white hover:bg-brand-700">
            مشاهده و خرید
          </Link>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton({ variant = "grid" }: { variant?: EventCardVariant }) {
  if (variant === "grid") {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card" aria-hidden>
        <Skeleton className="aspect-[16/10] w-full rounded-none" />
        <div className="space-y-2.5 p-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  const compact = variant === "compact";
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-surface p-2.5 shadow-card" aria-hidden>
      <Skeleton className={cn("shrink-0 rounded-xl", compact ? "h-[86px] w-[104px]" : "h-[150px] w-[118px]")} />
      <div className="flex-1 space-y-2.5 py-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        {!compact && <Skeleton className="mt-4 h-9 w-full rounded-lg" />}
      </div>
    </div>
  );
}
