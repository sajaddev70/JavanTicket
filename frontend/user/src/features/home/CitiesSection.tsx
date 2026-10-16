"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useCities } from "@/hooks/useContent";
import { SectionCard } from "@/components/shared/SectionCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { faNumber } from "@/lib/format";
import { mediaUrl } from "@/lib/media";

const SHOWN = 6;

/** "رویدادها در شهرهای مختلف": cities with upcoming events, linking to the events page of each city. */
export function CitiesSection() {
  const { data } = useCities();
  const cities = (data ?? []).filter((c) => c.events_count > 0).sort((a, b) => b.events_count - a.events_count);
  if (!cities.length) return null;
  const shown = cities.slice(0, SHOWN);
  const others = cities.slice(SHOWN);

  return (
    <SectionCard title="رویدادها در شهرهای مختلف" headingId="home-cities" moreHref="/events" moreLabel="مشاهده شهرها">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {shown.map((c) => (
          <li key={c.id}>
            <Link href={`/events?city=${c.id}`} className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-2 transition hover:border-brand-500/40 hover:shadow-card">
              <div className="relative h-[58px] w-[78px] shrink-0 overflow-hidden rounded-xl bg-field">
                <SmartImage src={mediaUrl(c.image_url)} fallback={null} alt="" fill sizes="80px" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-black text-ink">{c.name}</p>
                <p className="mt-1 text-[12px] text-muted">{faNumber(c.events_count)} رویداد</p>
              </div>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/events" className="flex h-full min-h-[74px] items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 transition hover:border-brand-500/40">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink-2">
              <MapPin className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[14.5px] font-black text-ink">سایر شهرها</p>
              <p className="mt-1 text-[12px] text-muted">{others.length ? `+ ${faNumber(others.length)} شهر` : "همه رویدادها"}</p>
            </div>
          </Link>
        </li>
      </ul>
    </SectionCard>
  );
}
