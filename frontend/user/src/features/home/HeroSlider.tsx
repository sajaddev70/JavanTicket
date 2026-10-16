"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBanners, usePageBlocks } from "@/hooks/useContent";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { BrandLogo } from "@/components/ui/BrandLogo";
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
        href: b.link_url ?? (b.event_slug ? `/events/${b.event_slug}` : null),
        button: b.button_text,
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

  if (blocks.isLoading || banners.isLoading) return <Skeleton className="h-[300px] w-full rounded-[22px] sm:h-[210px] lg:h-[210px]" />;
  if (!count) return null;
  const current = index % count;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="رویدادهای برگزیده"
      className="relative overflow-hidden rounded-[22px] bg-navy-950 text-white shadow-float"
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
          <div className="absolute inset-y-0 left-0 w-full md:w-[62%]">
            <SmartImage src={mediaUrl(slide.image)} fallback={null} alt="" fill preload={i === 0} sizes="(min-width: 768px) 62vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#071834] via-[#071834]/85 to-[#071834]/25 md:bg-gradient-to-l md:from-[#0a2f7a] md:from-30% md:via-[#0b2a66]/85 md:via-50% md:to-transparent" />
          <div className="relative flex min-h-[300px] items-end gap-8 p-5 sm:min-h-[210px] sm:items-center sm:p-8 lg:px-10">
            <div className="hidden shrink-0 flex-col items-center md:flex">
              <BrandLogo variant="light" width={150} className="h-auto w-[130px] lg:w-[150px]" />
            </div>
            <div className="max-w-[620px]">
              {slide.kicker && <p className="text-[13px] font-medium text-white/80 sm:text-[14px]">{slide.kicker}</p>}
              {i === 0 ? (
                <h1 className="mt-1 text-[24px] font-black leading-[1.45] sm:text-[30px] lg:text-[36px]">{slide.title}</h1>
              ) : (
                <h2 className="mt-1 text-[24px] font-black leading-[1.45] sm:text-[30px] lg:text-[36px]">{slide.title}</h2>
              )}
              {slide.subtitle && <p className="mt-2 text-[14px] leading-7 text-white/85 sm:text-[16px]">{slide.subtitle}</p>}
              {slide.href && slide.button && (
                <Link
                  href={slide.href}
                  tabIndex={i === current ? 0 : -1}
                  className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-xl bg-brand-600 px-7 text-[15px] font-bold text-white shadow-cta hover:bg-brand-700"
                >
                  {slide.button}
                  <ArrowLeft className="size-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1" role="tablist" aria-label="انتخاب اسلاید">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`اسلاید ${(i + 1).toLocaleString("fa-IR")}`}
              onClick={() => setIndex(i)}
              className="flex size-6 items-center justify-center"
            >
              <span className={cn("block rounded-full transition-all", i === current ? "h-2.5 w-2.5 bg-white" : "size-2.5 border border-white/70")} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
