'use client';

import Link from "next/link";
import { CalendarDays, Heart, MapPin, Ticket } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFavoritesStore } from "@/stores/useFavoritesStore";
import { faDate, faDateRange, faNumber, faTime } from "@/lib/format";
import { categoryBadge } from "@/lib/visuals";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PublicEvent } from "@/services/public";

function eventDate(e: PublicEvent): { date: string; time?: string } {
  if (e.start_date && e.end_date && e.start_date.slice(0, 10) !== e.end_date.slice(0, 10)) return { date: faDateRange(e.start_date, e.end_date) };
  const at = e.next_session_at ?? e.start_date;
  if (at) return { date: `${new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(new Date(at))} ${faDate(at)}`, time: faTime(at) };
  return { date: "زمان به‌زودی اعلام می‌شود" };
}

/**
 * Event card. "home": soft badge on the top corner (recommended carousel); "list": solid badge on the image
 * bottom and a price box (events page); "row": horizontal layout for the list view.
 */
export function EventCard({ event, variant = "list" }: { event: PublicEvent; variant?: "home" | "list" | "row" }) {
  const favorite = useFavoritesStore((s) => s.ids.includes(event.id));
  const toggle = useFavoritesStore((s) => s.toggle);
  const href = `/events/${encodeURIComponent(event.slug)}`;
  const when = eventDate(event);
  const place = variant === "home" ? [event.city_name, [event.hall_name, event.venue_name].filter(Boolean).join(" ")].filter(Boolean).join("، ") : event.city_name;
  const color = event.category_color ?? "#2f80f5";

  const image = (
    <div className={cn("relative overflow-hidden rounded-xl bg-field", variant === "row" ? "aspect-[16/10] w-40 shrink-0 sm:w-60" : "aspect-[27/10]")}>
      <Link href={href} tabIndex={-1} aria-hidden>
        <SmartImage
          src={mediaUrl(event.banner_url)}
          fallback={mediaUrl(event.category_cover_url)}
          alt=""
          fill
          sizes="(min-width: 1280px) 320px, (min-width: 768px) 30vw, 80vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
      </Link>
      {event.category_name &&
        (variant === "home" ? (
          <span
            className="absolute right-2.5 top-2.5 rounded-full px-3 py-1 text-[12px] font-bold shadow-sm"
            style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}
          >
            {event.category_name}
          </span>
        ) : (
          <span className="absolute bottom-2.5 right-2.5 rounded-lg px-2.5 py-1 text-[12px] font-bold text-white shadow" style={categoryBadge(color)}>
            {event.category_name}
          </span>
        ))}
      <button
        type="button"
        onClick={() => toggle(event.id)}
        aria-pressed={favorite}
        aria-label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        className="absolute left-2.5 top-2.5 flex size-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-white"
      >
        <Heart className={cn("size-[18px]", favorite && "fill-ticket text-ticket")} />
      </button>
    </div>
  );

  const price = event.min_price !== null && event.min_price !== undefined && Number(event.min_price) > 0;

  return (
    <article
      className={cn(
        "flex h-full rounded-[18px] border border-line bg-surface p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-float",
        variant === "row" ? "flex-row gap-4" : "flex-col",
      )}
    >
      {image}
      <div className={cn("flex min-w-0 flex-1 flex-col", variant === "row" ? "py-1" : "px-1.5 pt-3")}>
        <h3 className="line-clamp-2 min-h-[2lh] text-[15.5px] font-black leading-7 text-ink">
          <Link href={href} className="hover:text-brand-600">
            {event.title}
          </Link>
        </h3>
        {variant === "home" ? (
          <>
            {place && (
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
                <MapPin className="size-4 shrink-0 text-ink/70" />
                <span className="truncate">{place}</span>
              </p>
            )}
            <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
              <CalendarDays className="size-4 shrink-0 text-ink/70" />
              <span className="truncate">{when.date}</span>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
              <CalendarDays className="size-4 shrink-0 text-ink/70" />
              <span className="truncate">
                {when.date}
                {when.time && <span className="tabular mx-1.5 text-line-strong">|</span>}
                {when.time}
              </span>
            </p>
            {place && (
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
                <MapPin className="size-4 shrink-0 text-ink/70" />
                <span className="truncate">{place}</span>
              </p>
            )}
          </>
        )}
        <div className={cn("mt-auto flex items-center gap-2 pt-3", variant !== "home" && "rounded-xl bg-surface-2 p-1")}>
          {variant === "home" ? (
            <>
              <span className="text-[13.5px] font-black text-brand-600">{price ? `از ${faNumber(Number(event.min_price))} تومان` : ""}</span>
              <Link href={href} className="mr-auto flex h-10 items-center rounded-xl bg-brand-600 px-5 text-[13.5px] font-bold text-white hover:bg-brand-700">
                خرید بلیت
              </Link>
            </>
          ) : (
            <>
              <Link href={href} className="flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-[13.5px] font-bold text-white hover:bg-brand-700 sm:px-6">
                <Ticket className="size-[18px] -rotate-45" />
                خرید بلیت
              </Link>
              <span className="mr-auto pl-2 text-[12.5px] text-muted">
                {price && (
                  <>
                    از <b className="text-[13.5px] text-ink">{faNumber(Number(event.min_price))}</b> تومان
                  </>
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-[18px] border border-line bg-surface p-2.5 shadow-card">
      <Skeleton className="aspect-[27/10] w-full rounded-xl" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-3 h-3 w-2/3" />
      <Skeleton className="mt-2.5 h-3 w-1/2" />
      <Skeleton className="mt-4 h-11 w-full rounded-xl" />
    </div>
  );
}
