import { faPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Seat, SeatTier } from "@/types/event";

type Swatch = "free" | "selected" | "sold" | "vip" | "locked" | "reserved";

/** Small seat drawn like the seats of the map, for the legend. */
function SeatSwatch({ kind }: { kind: Swatch }) {
  const paint: Record<Swatch, { fill: string; stroke: string }> = {
    free: { fill: "var(--seat-free)", stroke: "var(--seat-free-stroke)" },
    selected: { fill: "var(--seat-selected)", stroke: "var(--seat-selected)" },
    sold: { fill: "var(--seat-sold)", stroke: "var(--seat-sold-stroke)" },
    vip: { fill: "var(--seat-vip)", stroke: "var(--seat-vip-stroke)" },
    locked: { fill: "var(--seat-locked)", stroke: "var(--seat-locked-stroke)" },
    reserved: { fill: "var(--seat-reserved)", stroke: "var(--seat-reserved-stroke)" },
  };
  const { fill, stroke } = paint[kind];
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill={fill} stroke={stroke} strokeWidth="1.3" />
      {kind === "selected" && <path d="m7.5 12.3 3 3 6-6.3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === "sold" && <path d="m8.5 8.5 7 7m0-7-7 7" stroke="var(--seat-sold-mark)" strokeWidth="1.6" strokeLinecap="round" />}
      {kind === "vip" && <path d="m7 15 .8-6 2.6 2.4L12 8l1.6 3.4L16.2 9l.8 6z" fill="#fff" />}
      {kind === "locked" && <circle cx="12" cy="12" r="2.4" fill="var(--muted)" />}
    </svg>
  );
}

/** Seat states present in the hall (from the live map) and the price of each tier (backend). */
export function SeatLegend({ seats, tiers, fallbackPrice, isVip, className }: { seats: Seat[]; tiers: SeatTier[]; fallbackPrice: number; isVip: (t: SeatTier) => boolean; className?: string }) {
  const has = (status: Seat["status"]) => seats.some((s) => s.status === status);
  const vipTiers = tiers.filter(isVip);
  const items: { kind: Swatch; label: string }[] = [
    { kind: "free", label: "صندلی آزاد" },
    { kind: "selected", label: "صندلی انتخاب‌شده" },
    { kind: "sold", label: "صندلی فروخته شده" },
    ...(vipTiers.length ? [{ kind: "vip" as const, label: "صندلی VIP" }] : []),
    ...(has("LOCKED") ? [{ kind: "locked" as const, label: "در حال خرید" }] : []),
    ...(has("B2B_RESERVED") ? [{ kind: "reserved" as const, label: "رزرو سازمانی" }] : []),
  ];
  const priced = tiers.filter((t) => t.price !== null || fallbackPrice);
  return (
    <div className={cn("rounded-2xl border border-line bg-surface px-3.5 py-3", className)}>
      <ul className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 text-[12.5px] text-ink-2">
        {items.map((i) => (
          <li key={i.kind} className="flex items-center gap-1.5">
            <SeatSwatch kind={i.kind} />
            {i.label}
          </li>
        ))}
      </ul>
      {priced.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3 text-[12px]" aria-label="قیمت بخش‌ها">
          {priced.map((t) => (
            <li key={t.code} className="rounded-lg bg-surface-2 px-2.5 py-1 text-ink-2">
              {t.name}: <b className="font-bold text-ink">{faPrice(t.price ?? fallbackPrice)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
