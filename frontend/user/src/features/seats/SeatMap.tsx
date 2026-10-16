"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import { faNumber, faPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { HallSection, Seat, SeatStatus, SeatTier } from "@/types/event";

/** Pixels per seat unit in the SVG (backend coordinates are in seat units). */
const U = 24;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

export const STATUS_LABEL: Record<SeatStatus, string> = {
  AVAILABLE: "آزاد",
  SELECTED: "انتخاب شما",
  LOCKED: "در حال خرید توسط کاربر دیگر",
  SOLD: "فروخته شده",
  B2B_RESERVED: "رزرو سازمانی",
  DISABLED: "غیرقابل انتخاب",
};

export interface SeatMapProps {
  seats: Seat[];
  sections: HallSection[];
  tiers: SeatTier[];
  fallbackPrice: number;
  /** Seats whose lock / release request is in flight. */
  pending: Set<number>;
  onToggle: (seat: Seat) => void;
}

interface View {
  scale: number;
  x: number;
  y: number;
}

/** Fill of a seat: its tier color while free (prices differ per tier), fixed colors for every other state. */
function seatFill(seat: Seat, tierColor: string | undefined): string {
  switch (seat.status) {
    case "SELECTED":
      return "var(--seat-selected)";
    case "SOLD":
      return "var(--seat-sold)";
    case "LOCKED":
      return "var(--seat-locked)";
    case "B2B_RESERVED":
      return "var(--seat-reserved)";
    case "DISABLED":
      return "var(--seat-disabled)";
    default:
      return tierColor ? `color-mix(in srgb, ${tierColor} 30%, var(--seat-free))` : "var(--seat-free)";
  }
}

export const SeatMap = memo(function SeatMap({ seats, sections, tiers, fallbackPrice, pending, onToggle }: SeatMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);
  const seatRefs = useRef(new Map<number, SVGGElement>());
  const drag = useRef<{ pointers: Map<number, { x: number; y: number }>; moved: boolean; start?: { view: View; x: number; y: number; dist?: number; mid?: { x: number; y: number } } }>({
    pointers: new Map(),
    moved: false,
  });

  const tierByCode = useMemo(() => new Map(tiers.map((t) => [t.code, t])), [tiers]);
  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  // Geometry of the drawing, in SVG units.
  const layout = useMemo(() => {
    const xs = seats.map((s) => Number(s.x));
    const ys = seats.map((s) => Number(s.y));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 2.2;
    const stage = 4.2;
    const vb = { x: (minX - pad) * U, y: (minY - pad - stage) * U, w: (maxX - minX + pad * 2) * U, h: (maxY - minY + pad * 2 + stage) * U };
    // Row labels only at the outer edges of the hall, as on printed seating plans.
    const edgeRows = new Map<number, { label: string; y: number }>();
    for (const s of seats) {
      const r = edgeRows.get(s.row_index);
      if (!r || Number(s.y) > r.y) edgeRows.set(s.row_index, { label: s.row_label, y: Number(s.y) });
    }
    return { minX, maxX, minY, maxY, vb, stage, edgeRows: [...edgeRows.values()] };
  }, [seats]);

  // Rendered size of the SVG at scale 1 fills the container width.
  const contentW = size.w;
  const contentH = size.w ? (size.w * layout.vb.h) / layout.vb.w : 0;
  const pxPerUnit = size.w ? size.w / layout.vb.w : 0;

  const clamp = useCallback(
    (v: View): View => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale));
      const fit = (pos: number, content: number, container: number) =>
        content <= container ? (container - content) / 2 : Math.min(0, Math.max(container - content, pos));
      return { scale, x: fit(v.x, contentW * scale, size.w), y: fit(v.y, contentH * scale, size.h) };
    },
    [contentW, contentH, size.w, size.h],
  );

  // Track the container size; phones start zoomed in so seats are big enough to tap.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const initialized = useRef(false);
  useEffect(() => {
    if (!size.w || initialized.current) return;
    initialized.current = true;
    const seatPx = U * (size.w / layout.vb.w);
    const scale = Math.min(MAX_SCALE, Math.max(1, 22 / seatPx));
    // Centered horizontally, stage at the top.
    setView(clamp({ scale, x: (size.w - size.w * scale) / 2, y: 0 }));
  }, [size.w, layout.vb.w, clamp]);

  const zoomAt = useCallback(
    (factor: number, cx = size.w / 2, cy = size.h / 2) =>
      setView((v) => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
        const k = scale / v.scale;
        return clamp({ scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k });
      }),
    [clamp, size.w, size.h],
  );

  // Wheel / trackpad zoom around the pointer (non-passive so the page does not scroll).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // Drag to pan, two fingers to pinch-zoom. A drag never counts as a seat click.
  function onPointerDown(e: React.PointerEvent) {
    const d = drag.current;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (d.pointers.size === 1) d.moved = false;
    const pts = [...d.pointers.values()];
    const rect = box.current!.getBoundingClientRect();
    d.start =
      pts.length >= 2
        ? {
            view,
            x: 0,
            y: 0,
            dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
            mid: { x: (pts[0].x + pts[1].x) / 2 - rect.left, y: (pts[0].y + pts[1].y) / 2 - rect.top },
          }
        : { view, x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.pointers.has(e.pointerId) || !d.start) return;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...d.pointers.values()];
    if (pts.length >= 2 && d.start.dist && d.start.mid) {
      d.moved = true;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const { view: v0, mid } = d.start;
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v0.scale * (dist / d.start.dist)));
      const k = scale / v0.scale;
      setView(clamp({ scale, x: mid.x - (mid.x - v0.x) * k, y: mid.y - (mid.y - v0.y) * k }));
      return;
    }
    const dx = e.clientX - d.start.x;
    const dy = e.clientY - d.start.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) box.current?.setPointerCapture(e.pointerId);
    d.moved = true;
    setView(clamp({ ...d.start.view, x: d.start.view.x + dx, y: d.start.view.y + dy }));
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    d.pointers.delete(e.pointerId);
    if (d.pointers.size === 1) {
      const [p] = [...d.pointers.values()];
      d.start = { view, x: p.x, y: p.y };
    } else if (!d.pointers.size) d.start = undefined;
  }

  const selectable = (s: Seat) => s.status === "AVAILABLE" || s.status === "SELECTED";

  function activate(seat: Seat) {
    if (drag.current.moved || !selectable(seat) || pending.has(seat.id)) return;
    onToggle(seat);
  }

  // Keyboard: one seat is tabbable; arrows move to the nearest seat in that direction, Enter / Space toggle.
  const byRow = useMemo(() => {
    const m = new Map<number, Seat[]>();
    for (const s of seats) m.set(s.row_index, [...(m.get(s.row_index) ?? []), s]);
    m.forEach((list) => list.sort((a, b) => Number(a.x) - Number(b.x)));
    return m;
  }, [seats]);
  const rowIndexes = useMemo(() => [...byRow.keys()].sort((a, b) => a - b), [byRow]);
  const firstFocusable = useMemo(() => seats.find((s) => s.status === "AVAILABLE")?.id ?? seats[0]?.id, [seats]);
  const tabSeat = focusId ?? firstFocusable;

  function neighbor(seat: Seat, key: string): Seat | undefined {
    const x = Number(seat.x);
    if (key === "ArrowLeft" || key === "ArrowRight") {
      const row = byRow.get(seat.row_index) ?? [];
      const i = row.findIndex((s) => s.id === seat.id);
      return row[i + (key === "ArrowLeft" ? -1 : 1)];
    }
    const ri = rowIndexes.indexOf(seat.row_index) + (key === "ArrowUp" ? -1 : 1);
    const row = byRow.get(rowIndexes[ri]);
    return row?.reduce((best, s) => (Math.abs(Number(s.x) - x) < Math.abs(Number(best.x) - x) ? s : best), row[0]);
  }

  function onSeatKey(e: React.KeyboardEvent, seat: Seat) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      drag.current.moved = false;
      activate(seat);
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = neighbor(seat, e.key);
    if (!next) return;
    setFocusId(next.id);
    seatRefs.current.get(next.id)?.focus({ preventScroll: true });
    revealSeat(next);
  }

  /** Pans so a seat reached with the keyboard is on screen. */
  function revealSeat(seat: Seat) {
    setView((v) => {
      const px = ((Number(seat.x) * U - layout.vb.x) * pxPerUnit) * v.scale + v.x;
      const py = ((Number(seat.y) * U - layout.vb.y) * pxPerUnit) * v.scale + v.y;
      const margin = 40;
      let { x, y } = v;
      if (px < margin) x += margin - px;
      if (px > size.w - margin) x -= px - (size.w - margin);
      if (py < margin) y += margin - py;
      if (py > size.h - margin) y -= py - (size.h - margin);
      return clamp({ ...v, x, y });
    });
  }

  const seatLabel = (s: Seat) => {
    const section = sectionById.get(s.section_id)?.name;
    const tier = tierByCode.get(s.tier_code ?? "");
    return [section && `سکشن ${section}`, `ردیف ${s.row_label}`, `صندلی ${faNumber(s.seat_number)}`, tier?.name, faPrice(tier?.price ?? fallbackPrice), STATUS_LABEL[s.status]]
      .filter(Boolean)
      .join("، ");
  };

  const hovered = hover !== null ? seats.find((s) => s.id === hover) : undefined;
  const tip = hovered && pxPerUnit
    ? {
        left: ((Number(hovered.x) * U - layout.vb.x) * pxPerUnit) * view.scale + view.x,
        top: ((Number(hovered.y) * U - layout.vb.y) * pxPerUnit) * view.scale + view.y,
      }
    : null;

  const sw = 0.82 * U;
  const sh = 0.7 * U;
  const cx = ((layout.minX + layout.maxX) / 2) * U;
  const stageTop = (layout.minY - 2.2 - layout.stage + 0.3) * U;

  const drawing = (mini: boolean) => (
    <svg
      viewBox={`${layout.vb.x} ${layout.vb.y} ${layout.vb.w} ${layout.vb.h}`}
      className="block h-auto w-full select-none"
      role={mini ? "presentation" : "group"}
      aria-label={mini ? undefined : "نقشه صندلی‌های سالن"}
      aria-hidden={mini || undefined}
    >
      <defs>
        <linearGradient id={mini ? "stage-m" : "stage"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--stage)" />
          <stop offset="1" stopColor="var(--navy-800)" />
        </linearGradient>
      </defs>
      <path
        d={`M ${cx - layout.vb.w * 0.24} ${stageTop} h ${layout.vb.w * 0.48} l ${-U * 1.4} ${U * 2.8} h ${-(layout.vb.w * 0.48 - U * 2.8)} z`}
        fill={`url(#${mini ? "stage-m" : "stage"})`}
      />
      {!mini && (
        <text x={cx} y={stageTop + U * 1.7} textAnchor="middle" fontSize={U * 0.85} fontWeight={800} fill="#fff" fontFamily="var(--font-sans)">
          صحنه
        </text>
      )}
      {!mini &&
        layout.edgeRows.map((r) => (
          <g key={r.label + r.y} fontSize={U * 0.5} fontWeight={700} fill="var(--muted)" textAnchor="middle" fontFamily="var(--font-sans)" aria-hidden>
            <text x={(layout.minX - 1.3) * U} y={r.y * U + U * 0.18}>
              {r.label}
            </text>
            <text x={(layout.maxX + 1.3) * U} y={r.y * U + U * 0.18}>
              {r.label}
            </text>
          </g>
        ))}
      {seats.map((s) => {
        const x = Number(s.x) * U;
        const y = Number(s.y) * U;
        const fill = seatFill(s, tierByCode.get(s.tier_code ?? "")?.color);
        if (mini) return <rect key={s.id} x={x - sw / 2} y={y - sh / 2} width={sw} height={sh} rx={4} fill={fill} />;
        const can = selectable(s);
        const busy = pending.has(s.id);
        const selected = s.status === "SELECTED";
        return (
          <g
            key={s.id}
            ref={(el) => {
              if (el) seatRefs.current.set(s.id, el);
              else seatRefs.current.delete(s.id);
            }}
            role="button"
            tabIndex={s.id === tabSeat ? 0 : -1}
            aria-label={seatLabel(s)}
            aria-pressed={selected}
            aria-disabled={!can || undefined}
            onClick={() => activate(s)}
            onKeyDown={(e) => onSeatKey(e, s)}
            onFocus={() => {
              setFocusId(s.id);
              setHover(s.id);
            }}
            onBlur={() => setHover((h) => (h === s.id ? null : h))}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(s.id)}
            onPointerLeave={() => setHover((h) => (h === s.id ? null : h))}
            className={cn("outline-none [&:focus-visible>rect:first-child]:stroke-[3px] [&:focus-visible>rect:first-child]:stroke-brand-500", can ? "cursor-pointer" : "cursor-not-allowed", busy && "animate-pulse")}
          >
            {/* chair: seat with a backrest on the stage side */}
            <rect x={x - sw / 2} y={y - sh / 2} width={sw} height={sh} rx={5} fill={fill} stroke={selected ? "var(--brand-700)" : "rgb(0 0 0 / 0.08)"} strokeWidth={1} />
            <rect x={x - sw / 2 + 2} y={y - sh / 2 - 3.2} width={sw - 4} height={3.6} rx={1.8} fill={fill} opacity={0.75} />
            {selected && <path d={`M ${x - 4.5} ${y} l 3.2 3.2 l 6 -6.4`} stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />}
            {s.status === "LOCKED" && <circle cx={x} cy={y} r={2.2} fill="var(--ink-2)" opacity={0.5} pointerEvents="none" />}
          </g>
        );
      })}
    </svg>
  );

  const zoomed = view.scale > 1.01;
  // Minimap viewport rectangle, as fractions of the drawing.
  const viewport =
    contentW && contentH
      ? {
          left: Math.max(0, -view.x / (contentW * view.scale)),
          top: Math.max(0, -view.y / (contentH * view.scale)),
          width: Math.min(1, size.w / (contentW * view.scale)),
          height: Math.min(1, size.h / (contentH * view.scale)),
        }
      : null;

  return (
    <div className="relative">
      <div
        ref={box}
        className="relative h-[58vh] max-h-[640px] min-h-[340px] touch-none overflow-hidden rounded-2xl bg-surface-2"
        // The whole hall fits at the initial zoom: height follows the drawing's aspect ratio.
        style={contentH ? { height: Math.round(contentH) } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div style={{ width: contentW || "100%", transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "0 0" }} className="will-change-transform">
          {drawing(false)}
        </div>

        {tip && hovered && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 w-max max-w-[240px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl bg-navy-950 px-3 py-2 text-[12.5px] leading-6 text-white shadow-float"
            style={{ left: tip.left, top: tip.top }}
          >
            <p className="font-bold">
              {sectionById.get(hovered.section_id)?.name && `سکشن ${sectionById.get(hovered.section_id)?.name} - `}ردیف {hovered.row_label} - صندلی {faNumber(hovered.seat_number)}
            </p>
            <p className="text-white/80">
              {tierByCode.get(hovered.tier_code ?? "")?.name ?? "عادی"} • {faPrice(tierByCode.get(hovered.tier_code ?? "")?.price ?? fallbackPrice)}
            </p>
            {hovered.status !== "AVAILABLE" && <p className="text-white/70">{STATUS_LABEL[hovered.status]}</p>}
          </div>
        )}
      </div>

      {/* Zoom controls (start side, as in the design) */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <button type="button" onClick={() => zoomAt(1.35)} disabled={view.scale >= MAX_SCALE} aria-label="بزرگ‌نمایی" className="flex size-11 items-center justify-center text-ink hover:text-brand-600 disabled:opacity-40">
          <Plus className="size-5" />
        </button>
        <button type="button" onClick={() => zoomAt(1 / 1.35)} disabled={!zoomed} aria-label="کوچک‌نمایی" className="flex size-11 items-center justify-center border-y border-line text-ink hover:text-brand-600 disabled:opacity-40">
          <Minus className="size-5" />
        </button>
        <button type="button" onClick={() => setView(clamp({ scale: 1, x: 0, y: 0 }))} aria-label="بازنشانی بزرگ‌نمایی" className="flex size-11 items-center justify-center text-ink hover:text-brand-600">
          <Crosshair className="size-5" />
        </button>
      </div>

      {/* Minimap: the whole hall with the visible area; click to jump there */}
      <div className="absolute left-3 top-3 hidden w-[150px] rounded-xl border border-line bg-surface p-2 shadow-card md:block">
        <div
          className="relative cursor-pointer overflow-hidden rounded-lg bg-surface-2"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const fx = (e.clientX - r.left) / r.width;
            const fy = (e.clientY - r.top) / r.height;
            setView((v) => clamp({ ...v, x: size.w / 2 - fx * contentW * v.scale, y: size.h / 2 - fy * contentH * v.scale }));
          }}
          aria-hidden
        >
          {drawing(true)}
          {zoomed && viewport && (
            <span
              className="absolute rounded-sm border-2 border-brand-600 bg-brand-500/10"
              style={{ left: `${viewport.left * 100}%`, top: `${viewport.top * 100}%`, width: `${viewport.width * 100}%`, height: `${viewport.height * 100}%` }}
            />
          )}
        </div>
        <p className="mt-1.5 text-center text-[11.5px] font-semibold text-ink-2">نمای کلی سالن</p>
      </div>
    </div>
  );
});

/** Legend under the map: tiers with their prices, then the other seat states. */
export function SeatLegend({ tiers, fallbackPrice }: { tiers: SeatTier[]; fallbackPrice: number }) {
  const swatch = (fill: string) => <span className="inline-block h-4 w-5 rounded-[5px] border border-black/10" style={{ background: fill }} aria-hidden />;
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12.5px] text-ink-2">
      {tiers
        .filter((t) => t.price !== null || fallbackPrice)
        .map((t) => (
          <li key={t.code} className="flex items-center gap-2">
            {swatch(`color-mix(in srgb, ${t.color} 30%, var(--seat-free))`)}
            {t.name} <span className="text-muted">({faPrice(t.price ?? fallbackPrice)})</span>
          </li>
        ))}
      <li className="flex items-center gap-2">{swatch("var(--seat-selected)")} صندلی انتخاب‌شده</li>
      <li className="flex items-center gap-2">{swatch("var(--seat-sold)")} فروخته شده</li>
      <li className="flex items-center gap-2">{swatch("var(--seat-locked)")} در حال خرید</li>
      <li className="flex items-center gap-2">{swatch("var(--seat-reserved)")} رزرو سازمانی</li>
    </ul>
  );
}
