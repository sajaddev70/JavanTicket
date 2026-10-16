"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Horizontal, swipeable row with snap points and previous / next buttons (shown from md up when the row overflows).
 * RTL: the row starts on the right and scrollLeft runs negative.
 */
export function Carousel({ label, className, itemClassName, children }: { label: string; className?: string; itemClassName?: string; children: React.ReactNode[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos <= 4, end: pos >= max - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, children.length]);

  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: -dir * track.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <div className={cn("relative", className)} role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={track} onScroll={update} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-1">
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </div>
        ))}
      </div>
      {!edges.start && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="موارد قبلی"
          className="absolute -right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-float hover:text-brand-600 md:flex"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="موارد بعدی"
          className="absolute -left-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-float hover:text-brand-600 md:flex"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
    </div>
  );
}
