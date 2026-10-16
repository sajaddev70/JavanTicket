'use client';

import { forwardRef, useMemo } from "react";

export interface Seat {
  id: number;
  section_id: number;
  row_index: number;
  row_label: string;
  seat_number: number;
  x: number;
  y: number;
  tier_code?: string | null;
  status: string;
}

const UNIT = 24;
const R = 8.5;

/**
 * Hall seat map drawn as SVG from seat coordinates (seat units). Colors are plain values (no CSS variables)
 * so the drawing can be exported as an image as-is.
 */
export const SeatMap = forwardRef<SVGSVGElement, {
  seats: Seat[];
  colorOf: (seat: Seat) => string;
  selected?: Set<number>;
  onSeat?: (seat: Seat) => void;
  isSelectable?: (seat: Seat) => boolean;
  zoom?: number;
  dark?: boolean;
  entranceLabel?: string;
}>(function SeatMap({ seats, colorOf, selected, onSeat, isSelectable, zoom = 1, dark, entranceLabel }, ref) {
  const layout = useMemo(() => {
    if (!seats.length) return null;
    const xs = seats.map((s) => Number(s.x));
    const ys = seats.map((s) => Number(s.y));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const sections = new Map<number, { x0: number; x1: number; y0: number; y1: number }>();
    const rows = new Map<number, { label: string; ys: number[] }>();
    for (const s of seats) {
      const x = Number(s.x);
      const y = Number(s.y);
      const b = sections.get(s.section_id) ?? { x0: x, x1: x, y0: y, y1: y };
      sections.set(s.section_id, { x0: Math.min(b.x0, x), x1: Math.max(b.x1, x), y0: Math.min(b.y0, y), y1: Math.max(b.y1, y) });
      const r = rows.get(s.row_index) ?? { label: s.row_label, ys: [] };
      r.ys.push(y);
      rows.set(s.row_index, r);
    }
    return { minX, maxX, minY, maxY, sections: [...sections.values()], rows: [...rows.values()].map((r) => ({ label: r.label, y: Math.max(...r.ys) })) };
  }, [seats]);

  if (!layout) return null;
  const pad = 2.6;
  const stageH = 4;
  const vbX = (layout.minX - pad) * UNIT;
  const vbY = (layout.minY - pad - stageH) * UNIT;
  const vbW = (layout.maxX - layout.minX + pad * 2) * UNIT;
  const vbH = (layout.maxY - layout.minY + pad * 2 + stageH + (entranceLabel ? 2.2 : 0)) * UNIT;
  const cx = ((layout.minX + layout.maxX) / 2) * UNIT;
  const ink = dark ? "#cbd5e1" : "#475569";
  const block = dark ? "#1b2a45" : "#eef2f8";
  const stage = dark ? "#2b3f63" : "#3a4f73";

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      style={{ width: `${zoom * 100}%`, minWidth: 560 * zoom, height: "auto" }}
      className="mx-auto block max-w-none select-none"
      role="img"
      aria-label="نقشه صندلی‌های سالن"
      fontFamily="IRANSans, Tahoma, sans-serif"
    >
      {/* Stage */}
      <path
        d={`M ${cx - vbW * 0.3} ${(layout.minY - pad - stageH + 0.6) * UNIT} h ${vbW * 0.6} l ${-UNIT * 1.2} ${UNIT * 2.6} h ${-(vbW * 0.6 - UNIT * 2.4)} z`}
        fill={stage}
      />
      <text x={cx} y={(layout.minY - pad - stageH + 2.4) * UNIT} textAnchor="middle" fontSize={UNIT * 0.9} fontWeight={800} fill="#fff">
        صحنه
      </text>

      {/* Section blocks */}
      {layout.sections.map((b, i) => (
        <rect
          key={i}
          x={(b.x0 - 0.75) * UNIT}
          y={(b.y0 - 0.75) * UNIT}
          width={(b.x1 - b.x0 + 1.5) * UNIT}
          height={(b.y1 - b.y0 + 1.5) * UNIT}
          rx={UNIT * 0.6}
          fill={block}
        />
      ))}

      {/* Row labels on both sides */}
      {layout.rows.map((r) => (
        <g key={r.label} fontSize={UNIT * 0.52} fontWeight={700} fill={ink} textAnchor="middle">
          <text x={(layout.minX - pad + 0.9) * UNIT} y={r.y * UNIT + 4}>
            {r.label}
          </text>
          <text x={(layout.maxX + pad - 0.9) * UNIT} y={r.y * UNIT + 4}>
            {r.label}
          </text>
        </g>
      ))}

      {/* Seats */}
      {seats.map((s) => {
        const sel = selected?.has(s.id);
        const selectable = !isSelectable || isSelectable(s);
        return (
          <circle
            key={s.id}
            cx={Number(s.x) * UNIT}
            cy={Number(s.y) * UNIT}
            r={R}
            fill={sel ? "#2563eb" : colorOf(s)}
            stroke={sel ? "#1e40af" : "none"}
            strokeWidth={sel ? 2 : 0}
            style={{ cursor: onSeat && selectable ? "pointer" : "default" }}
            onClick={onSeat && selectable ? () => onSeat(s) : undefined}
          >
            <title>{`ردیف ${s.row_label} - صندلی ${s.seat_number}`}</title>
          </circle>
        );
      })}
      {selected &&
        seats
          .filter((s) => selected.has(s.id))
          .map((s) => (
            <path
              key={`c${s.id}`}
              d={`M ${Number(s.x) * UNIT - 3.6} ${Number(s.y) * UNIT} l 2.6 2.8 l 5 -5.4`}
              stroke="#fff"
              strokeWidth={2}
              fill="none"
              pointerEvents="none"
            />
          ))}

      {entranceLabel && (
        <>
          <rect x={cx - vbW * 0.2} y={(layout.maxY + 1.4) * UNIT} width={vbW * 0.4} height={UNIT * 1.3} rx={UNIT * 0.4} fill={block} />
          <text x={cx} y={(layout.maxY + 2.3) * UNIT} textAnchor="middle" fontSize={UNIT * 0.55} fill={ink}>
            {entranceLabel}
          </text>
        </>
      )}
    </svg>
  );
});

/** Downloads the rendered map as a PNG file. */
export async function exportSeatMap(svg: SVGSVGElement, fileName: string) {
  // Export at the map's natural size, independent of the on-screen zoom.
  const box = svg.viewBox.baseVal;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("style");
  clone.setAttribute("width", String(box.width));
  clone.setAttribute("height", String(box.height));
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = box.width * scale;
    canvas.height = box.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
