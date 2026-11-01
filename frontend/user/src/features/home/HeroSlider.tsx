"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBanners, usePageBlocks } from "@/hooks/useContent";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

interface Slide {
  key: string;
  kicker?: string | null;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  href?: string | null;
  button?: string | null;
}

const INTERVAL = 6500;

/** Homepage hero: the HOME_HERO block followed by the active banners, auto-advancing with dots and swipe. */
export function HeroSlider() {
  const blocks = usePageBlocks();
  const banners = useBanners();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const slides = useMemo<Slide[]>(() => {
    const hero = blocks.data?.HOME_HERO;
    const list: Slide[] = [];
    if (hero?.title) {
      list.push({ key: "hero", kicker: hero.kicker, title: hero.title, subtitle: hero.subtitle, image: hero.image_url, href: hero.button_url ?? "/events", button: hero.button_text ?? "مشاهده همه رویدادها" });
    }
    for (const b of banners.data ?? []) {
      list.push({
        key: `banner-${b.id}`,
        kicker: [b.category_name, b.city_name].filter(Boolean).join(" • ") || null,
        title: b.title,
        subtitle: b.subtitle,
        image: b.image_url ?? b.category_cover_url,
        // A banner tied to an event always follows the event's current slug, so renaming the event never leaves a dead link.
        href: b.event_slug ? `/events/${encodeURIComponent(b.event_slug)}` : b.link_url,
        button: b.button_text ?? (b.event_slug || b.link_url ? "مشاهده و خرید بلیت" : null),
      });
    }
    return list;
  }, [blocks.data, banners.data]);

  const count = slides.length;
  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(id);
  }, [count, paused]);

  if (blocks.isLoading || banners.isLoading) return <Skeleton className="h-[168px] w-full rounded-[23px] lg:h-[320px]" />;
  if (!count) return null;
  const current = index % count;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="رویدادهای برگزیده"
      className="bg-hero relative overflow-hidden rounded-[23px] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        // RTL: swiping left shows the next slide.
        if (Math.abs(dx) > 40) setIndex((i) => (i + (dx < 0 ? 1 : -1) + count) % count);
      }}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.key}
          role="group"
          aria-roledescription="slide"
          aria-label={`${(i + 1).toLocaleString("fa-IR")} از ${count.toLocaleString("fa-IR")}`}
          aria-hidden={i !== current}
          className={cn("transition-opacity duration-700", i === current ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0")}
        >
          <SmartImage src={mediaUrl(slide.image)} fallback={null} alt="" fill preload={i === 0} sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover opacity-55" />
          {/* Text sits on the start (right) side: the photo fades into the hero's indigo behind it */}
          <div className="absolute inset-0 bg-gradient-to-l from-[#0b1854]/80 to-transparent" />
          <div className="relative flex min-h-[168px] flex-col justify-center p-[18px] pb-7 lg:min-h-[320px] lg:px-12">
            <div className="max-w-[90%] sm:max-w-[560px]">
              <h2 className="text-[20px] font-black leading-[1.8] lg:text-[36px]">{slide.title}</h2>
              {(slide.subtitle ?? slide.kicker) && <p className="mt-1 text-[11px] leading-[1.8] text-white/90 lg:text-[15px]">{slide.subtitle ?? slide.kicker}</p>}
              {slide.href && slide.button && (
                <Link
                  href={slide.href}
                  tabIndex={i === current ? 0 : -1}
                  className="bg-cta mt-2.5 inline-flex min-h-10 items-center gap-2 rounded-[15px] px-5 text-[12px] font-black text-white"
                >
                  {slide.button}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
      {count > 1 && (
        <div className="absolute bottom-3 left-4 flex gap-0.5" role="tablist" aria-label="انتخاب اسلاید">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`اسلاید ${(i + 1).toLocaleString("fa-IR")}`}
              onClick={() => setIndex(i)}
              className="flex size-7 items-center justify-center"
            >
              <span className={cn("block rounded-full transition-all", i === current ? "h-2.5 w-2.5 bg-white" : "size-2 bg-white/45")} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
