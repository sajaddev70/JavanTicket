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

export function FavoriteButton({ event, className, plain }: { event: PublicEvent; className?: string; plain?: boolean }) {
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
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full transition",
        plain ? "text-ticket hover:bg-magenta-bg" : "bg-black/25 text-white backdrop-blur-[2px] hover:bg-black/40",
        className,
      )}
    >
      <Heart className={cn("size-[23px]", on && "fill-ticket text-ticket")} strokeWidth={2.1} />
    </button>
  );
}

/** White date tile on the poster corner: "۲۸ / اردیبهشت". */
function DateBadge({ iso, className }: { iso: string; className?: string }) {
  return (
    <span className={cn("flex min-w-[52px] flex-col items-center rounded-2xl bg-surface/95 px-2 py-1.5 text-ink shadow-card", className)}>
      <b className="text-[18px] font-black leading-6">{faDay(iso)}</b>
      <span className="text-[10.5px] font-medium leading-4 text-ink-2">{faMonth(iso)}</span>
    </span>
  );
}

export function Price({ event, className, chip }: { event: PublicEvent; className?: string; chip?: boolean }) {
  const price = Number(event.min_price ?? 0);
  if (!price) return <span className={cn("text-[13.5px] font-black text-success-fg", className)}>{event.min_price === 0 ? "رایگان" : ""}</span>;
  return (
    <span className={cn("inline-flex items-baseline gap-1 whitespace-nowrap text-[14px] font-black text-price", chip && "justify-center rounded-full bg-blue-bg px-3 py-2", className)}>
      از <b className="text-[16px] font-black">{faNumber(price)}</b> تومان
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
    <Link href={href} className="after:absolute after:inset-0 after:z-[1] hover:text-purple">
      {event.title}
    </Link>
  );

  if (variant === "compact") {
    return (
      <article className="group relative flex h-full min-h-[156px] gap-3 overflow-hidden rounded-[22px] border border-line bg-surface p-2 shadow-card transition hover:shadow-float">
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
    // Reference 02: poster on the start side, title / date / place, the blue starting price and an outline heart.
    return (
      <article className="group relative flex h-full gap-3.5 overflow-hidden rounded-[22px] border border-line bg-surface p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
        <Poster event={event} sizes="(min-width: 640px) 140px, 112px" className="aspect-[3/4] w-[104px] shrink-0 rounded-[16px] sm:w-[124px]" priority={priority} />
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div className="flex items-start gap-1">
            <h3 className="line-clamp-2 flex-1 text-[16px] font-black leading-7 text-ink">{titleLink}</h3>
            <FavoriteButton event={event} plain className="relative z-[2] -ml-2 -mt-1.5 size-10" />
          </div>
          <EventMeta when={when} place={place} />
          <div className="relative z-[2] mt-auto pt-2">
            <Price event={event} />
          </div>
        </div>
      </article>
    );
  }

  if (variant === "grid") {
    return (
      <article className="@container group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
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
    <ul className="mt-2 space-y-1.5 text-[12.5px] text-muted">
      <li className="flex items-center gap-1.5">
        <Icon name="common/calendar-simple" className="size-4 shrink-0 text-ink-2" />
        <span className="truncate">
          {when.date}
          {when.time && `، ساعت ${when.time}`}
        </span>
      </li>
      {place && (
        <li className="flex items-center gap-1.5">
          <Icon name="common/location" className="size-4 shrink-0 text-ink-2" />
          <span className="truncate">{place}</span>
        </li>
      )}
    </ul>
  );
}

function BuyLink({ href }: { href: string }) {
  return (
    <Link href={href} tabIndex={-1} className="bg-grad-primary glow-primary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[13.5px] font-black text-white transition hover:brightness-110">
      خرید بلیت
      <ArrowLeft className="size-[18px]" />
    </Link>
  );
}

export function EventCardSkeleton({ variant = "grid" }: { variant?: EventCardVariant }) {
  if (variant === "row") {
    return (
      <div className="flex gap-3.5 rounded-[22px] border border-line bg-surface p-3" aria-hidden>
        <Skeleton className="aspect-[3/4] w-[104px] rounded-[16px] sm:w-[124px]" />
        <div className="flex-1 space-y-2.5 py-1">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="mt-5 h-5 w-2/5" />
        </div>
      </div>
    );
  }
  if (variant === "compact") {
    return (
      <div className="flex h-[150px] gap-3 rounded-[22px] border border-line bg-surface p-2" aria-hidden>
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
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface" aria-hidden>
      <Skeleton className={cn("w-full rounded-none", variant === "poster" ? "aspect-[1.08] lg:aspect-[4/3]" : "aspect-[16/9]")} />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
        {variant !== "poster" && (
          <div className="flex justify-between pt-2">
            <Skeleton className="h-11 w-28 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
