"use client";

import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { useFavoriteToggle } from "@/features/profile/queries";
import { faDateRange, faDay, faFullDate, faMonth, faNumber, faTime, sameDay } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PublicEvent } from "@/types/event";

/**
 * Event card used across the site (all data from the API; the poster is the main graphic).
 * - poster: image on top with the date badge, title, venue and starting price (home "رویدادهای ویژه")
 * - grid: wider image, subtitle, date / place lines, price and buy button (events page)
 * - compact: text beside a portrait image (home "پیشنهادهای این هفته")
 * - row: wide horizontal card (events page, list view)
 */
export type EventCardVariant = "poster" | "grid" | "compact" | "row";

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

/** Next performance date of the card's badge: the next session, else the start date. */
const badgeDate = (e: PublicEvent) => e.next_session_at ?? e.start_date ?? null;

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
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-[2px] transition hover:bg-black/35", className)}
    >
      <Heart className={cn("size-[21px]", on && "fill-ticket text-ticket")} strokeWidth={2} />
    </button>
  );
}

/** White date tile on the poster corner: "۲۸ / اردیبهشت". */
function DateBadge({ iso, className }: { iso: string; className?: string }) {
  return (
    <span className={cn("flex min-w-[52px] flex-col items-center rounded-xl bg-surface/95 px-2 py-1.5 text-ink shadow-card", className)}>
      <b className="text-[18px] font-black leading-6">{faDay(iso)}</b>
      <span className="text-[10.5px] font-medium leading-4 text-ink-2">{faMonth(iso)}</span>
    </span>
  );
}

export function Price({ event, className, chip }: { event: PublicEvent; className?: string; chip?: boolean }) {
  const price = Number(event.min_price ?? 0);
  if (!price) return <span className={cn("text-[13.5px] font-black text-success-fg", className)}>{event.min_price === 0 ? "رایگان" : ""}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium text-brand-600", chip && "justify-center rounded-xl bg-brand-50 px-3 py-2", className)}>
      {!chip && <Icon name="common/ticket" className="size-[18px]" />}
      از <b className="text-[14.5px] font-black">{faNumber(price)}</b> <b className="font-bold">تومان</b>
    </span>
  );
}

function Poster({ event, sizes, className, priority, children }: { event: PublicEvent; sizes: string; className?: string; priority?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden bg-navy-900", className)}>
      <SmartImage
        src={mediaUrl(event.banner_url)}
        fallback={mediaUrl(event.category_cover_url)}
        alt={event.title}
        fill
        sizes={sizes}
        preload={priority}
        className="object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      {children}
    </div>
  );
}

export function EventCard({ event, variant = "grid", priority }: { event: PublicEvent; variant?: EventCardVariant; priority?: boolean }) {
  const href = `/events/${encodeURIComponent(event.slug)}`;
  const when = eventWhen(event);
  const place = eventPlace(event);
  const date = badgeDate(event);
  // The whole card is one link target; the heart and the buy button sit above the stretched link.
  const titleLink = (
    <Link href={href} className="after:absolute after:inset-0 after:z-[1] hover:text-brand-600">
      {event.title}
    </Link>
  );

  if (variant === "compact") {
    return (
      <article className="group relative flex h-full min-h-[156px] gap-3 overflow-hidden rounded-[18px] border border-line bg-surface p-2 shadow-card transition hover:shadow-float">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1.5 pr-1.5">
          <h3 className="line-clamp-2 text-[14.5px] font-black leading-6 text-ink">{titleLink}</h3>
          {place && (
            <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <Icon name="common/location" className="size-4 shrink-0" />
              <span className="truncate">{event.hall_name ?? event.venue_name ?? event.city_name}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
            <Icon name="common/calendar-simple" className="size-4 shrink-0" />
            <span className="truncate">{event.start_date && event.end_date ? faDateRange(event.start_date, event.end_date) : when.date}</span>
          </p>
          <Price event={event} className="mt-auto pt-1" />
        </div>
        <Poster event={event} sizes="120px" className="w-[38%] max-w-[132px] shrink-0 rounded-[14px]" priority={priority}>
          <FavoriteButton event={event} className="absolute left-1.5 top-1.5 z-[2] size-9" />
        </Poster>
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className="group relative flex h-full gap-4 overflow-hidden rounded-[18px] border border-line bg-surface p-2.5 shadow-card transition hover:shadow-float">
        <Poster event={event} sizes="(min-width: 640px) 240px, 128px" className="aspect-[4/3] w-32 shrink-0 rounded-[14px] sm:w-60" priority={priority}>
          <FavoriteButton event={event} className="absolute left-2 top-2 z-[2]" />
          {date && <DateBadge iso={date} className="absolute bottom-2 right-2" />}
        </Poster>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <h3 className="line-clamp-2 text-[16px] font-black leading-7 text-ink">{titleLink}</h3>
          {event.subtitle && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{event.subtitle}</p>}
          <EventMeta when={when} place={place} />
          <div className="relative z-[2] mt-auto flex items-center justify-between gap-2 pt-3">
            <Price event={event} chip />
            <BuyLink href={href} />
          </div>
        </div>
      </article>
    );
  }

  if (variant === "grid") {
    return (
      <article className="@container group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
        <Poster event={event} sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw" className="aspect-[16/9]" priority={priority}>
          <FavoriteButton event={event} className="absolute left-3 top-3 z-[2]" />
          {date && <DateBadge iso={date} className="absolute bottom-2.5 right-2.5" />}
        </Poster>
        <div className="flex flex-1 flex-col p-3 pt-2.5 @[280px]:p-3.5">
          <h3 className="line-clamp-1 text-[15px] font-black leading-7 text-ink @[280px]:text-[16px]">{titleLink}</h3>
          {event.subtitle && <p className="line-clamp-1 text-[12.5px] text-muted">{event.subtitle}</p>}
          <EventMeta when={when} place={place} />
          {/* Narrow (two-column phone grid): price above a full-width button; wider: side by side */}
          <div className="relative z-[2] mt-auto flex flex-col-reverse gap-2 pt-3 @[280px]:flex-row @[280px]:items-center @[280px]:justify-between">
            <BuyLink href={href} />
            <Price event={event} chip />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
      <Poster event={event} sizes="(min-width: 1280px) 280px, (min-width: 640px) 32vw, 48vw" className="aspect-[1.08] lg:aspect-[4/3]" priority={priority}>
        <FavoriteButton event={event} className="absolute left-2.5 top-2.5 z-[2]" />
        {date && <DateBadge iso={date} className="absolute bottom-2.5 right-2.5" />}
      </Poster>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-1 text-[15px] font-black leading-7 text-ink">{titleLink}</h3>
        {place && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
            <Icon name="common/location" className="size-4 shrink-0" />
            <span className="truncate">{event.hall_name ?? event.venue_name ?? event.city_name}</span>
          </p>
        )}
        <Price event={event} className="mt-auto" />
      </div>
    </article>
  );
}

function EventMeta({ when, place }: { when: { date: string; time?: string }; place: string }) {
  return (
    <ul className="mt-2.5 space-y-1.5 text-[12.5px] text-ink-2">
      <li className="flex items-center gap-1.5">
        <Icon name="common/calendar-simple" className="size-4 shrink-0 text-muted" />
        <span className="truncate">
          {when.date}
          {when.time && `، ساعت ${when.time}`}
        </span>
      </li>
      {place && (
        <li className="flex items-center gap-1.5">
          <Icon name="common/location" className="size-4 shrink-0 text-muted" />
          <span className="truncate">{place}</span>
        </li>
      )}
    </ul>
  );
}

function BuyLink({ href }: { href: string }) {
  return (
    <Link href={href} tabIndex={-1} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-[13.5px] font-bold text-white transition hover:bg-brand-700">
      خرید بلیت
      <ArrowLeft className="size-[18px]" />
    </Link>
  );
}

export function EventCardSkeleton({ variant = "grid" }: { variant?: EventCardVariant }) {
  if (variant === "compact") {
    return (
      <div className="flex h-[150px] gap-3 rounded-[18px] border border-line bg-surface p-2" aria-hidden>
        <div className="flex-1 space-y-2.5 py-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="mt-4 h-4 w-2/5" />
        </div>
        <Skeleton className="w-[38%] max-w-[132px] rounded-[14px]" />
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-surface" aria-hidden>
      <Skeleton className={cn("w-full rounded-none", variant === "poster" ? "aspect-[1.08] lg:aspect-[4/3]" : "aspect-[16/9]")} />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
        {variant !== "poster" && (
          <div className="flex justify-between pt-2">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}
