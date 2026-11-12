import Link from "next/link";
import { cn } from "@/lib/cn";

/** Stroke colors of the mark per tone (file/Javan_SVG_Assets/logos/svg). */
const TONES = {
  /** javan_logo_icon.svg — navy / blue / light cyan, for light surfaces */
  color: ["#163C8C", "#2F80FF", "#6EB8FF"],
  /** on the navy band: the light-cyan rendering of the references */
  light: ["#FFFFFF", "#9FD0FF", "#6EB8FF"],
  /** javan_logo_icon_mono_light.svg */
  white: ["#FFFFFF", "#FFFFFF", "#FFFFFF"],
  /** javan_logo_icon_mono_dark.svg */
  navy: ["#163C8C", "#163C8C", "#163C8C"],
} as const;

export type BrandTone = keyof typeof TONES;

/**
 * The Javan mark (javan_logo_icon.svg) drawn inline: six strokes fanning out under the red dot.
 * `tone` picks one of the official variants; the dot keeps the brand red except in the mono variants.
 */
export function BrandMark({ tone = "color", className }: { tone?: BrandTone; className?: string }) {
  const [a, b, c] = TONES[tone];
  const mono = tone === "white" || tone === "navy";
  return (
    <svg viewBox="40 36 176 162" aria-hidden className={cn("h-auto shrink-0", className)}>
      <g fill="none" strokeLinecap="round" strokeWidth={11.52}>
        <path d="M118 66.32C94 98.32 70 132.32 48 174.08" stroke={a} />
        <path d="M128 72.32C114 102.32 110 142.32 110 189.44" stroke={b} />
        <path d="M138 66.32C162 98.32 186 132.32 208 174.08" stroke={c} />
        <path d="M128 72.32C142 102.32 146 142.32 146 189.44" stroke={b} opacity={0.95} />
        <path d="M122 64.32C123 76.32 125 86.32 128 92.32" stroke={a} opacity={0.95} />
        <path d="M134 64.32C133 76.32 131 86.32 128 92.32" stroke={c} opacity={0.95} />
      </g>
      {!mono && <circle cx="128" cy="56.32" r="15.36" fill="#FF5A75" />}
    </svg>
  );
}

/**
 * Horizontal lockup (javan_logo_horizontal_*.svg): the mark, then the site's name from the admin settings —
 * the short name large, the rest of the full name above it ("مرکز همایش و نمایش" / "جوان").
 * `onBand` renders the light version used on the navy header band of the references.
 */
export function AppLogo({
  siteName,
  shortName,
  onBand = true,
  className,
}: {
  siteName?: string | null;
  shortName?: string | null;
  onBand?: boolean;
  className?: string;
}) {
  const name = shortName?.trim() || siteName?.trim() || "";
  const kicker = siteName && name && siteName.includes(name) && siteName.trim() !== name ? siteName.replace(name, "").trim() : null;
  return (
    <Link href="/" aria-label={siteName ? `${siteName} - صفحه اصلی` : "صفحه اصلی"} className={cn("flex min-h-11 shrink-0 items-center gap-2", className)}>
      {name && (
        <span className={cn("order-2 flex flex-col items-start leading-none", onBand ? "text-white" : "text-navy-800 dark:text-white")}>
          {kicker && <span className="whitespace-nowrap text-[9.5px] font-bold opacity-90 min-[400px]:text-[10px] lg:text-[11px]">{kicker}</span>}
          <span className="mt-1 text-[22px] font-black min-[400px]:text-[24px] lg:text-[26px]">{name}</span>
        </span>
      )}
      <BrandMark tone={onBand ? "light" : "color"} className={cn("order-1 w-[50px] min-[400px]:w-[56px] lg:w-[60px]", !onBand && "dark:hidden")} />
      {!onBand && <BrandMark tone="light" className="order-1 hidden w-[50px] min-[400px]:w-[56px] lg:w-[60px] dark:block" />}
    </Link>
  );
}
