import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The brand mark of the design package (assets/brand/javan-logo-mark.svg), drawn inline so the strokes follow the
 * theme: navy on light surfaces, white on dark ones. The dot keeps the brand red.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="30 6 160 96" aria-hidden className={cn("h-auto text-navy-900 dark:text-white", className)}>
      <circle cx="110" cy="22" r="13" fill="#F43F5E" />
      <g fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round">
        <path d="M110 37C95 52 78 69 42 89" />
        <path d="M110 37C102 55 91 73 67 96" />
        <path d="M110 37C118 55 129 73 153 96" />
        <path d="M110 37C125 52 142 69 178 89" />
      </g>
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
