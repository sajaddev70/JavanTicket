import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The brand mark of the app design, drawn inline so the lines follow the theme: navy on light surfaces, sky blue on
 * dark ones. The dot keeps the brand pink.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 40" aria-hidden className={cn("h-auto text-navy-900 dark:text-[#8ed4ff]", className)}>
      <circle cx="25" cy="6" r="5" fill="#FF4F94" />
      <path d="M25 13 3 34M25 13 47 34M25 13 15 35M25 13 35 35" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/**
 * Horizontal lockup of the headers: the mark, then the site's name from the admin settings — the short name large,
 * the rest of the full name above it ("مرکز همایش و نمایش" / "جوان").
 */
export function AppLogo({ siteName, shortName, className }: { siteName?: string | null; shortName?: string | null; className?: string }) {
  const name = shortName?.trim() || siteName?.trim() || "";
  const kicker = siteName && name && siteName.includes(name) && siteName.trim() !== name ? siteName.replace(name, "").trim() : null;
  return (
    <Link href="/" aria-label={siteName ? `${siteName} - صفحه اصلی` : "صفحه اصلی"} className={cn("flex min-h-11 shrink-0 items-center gap-2", className)}>
      <BrandMark className="w-[46px] min-[400px]:w-[54px] lg:w-[60px]" />
      {name && (
        <span className="flex flex-col leading-none text-navy-900 dark:text-white">
          {kicker && <span className="whitespace-nowrap text-[10px] font-bold min-[400px]:text-[10.5px] lg:text-[11px]">{kicker}</span>}
          <span className="mt-1 text-[20px] font-black min-[400px]:text-[22px] lg:text-[24px]">{name}</span>
        </span>
      )}
    </Link>
  );
}
