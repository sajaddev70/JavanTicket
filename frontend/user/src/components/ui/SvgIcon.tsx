import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

/**
 * Line icon (SVG) painted with `currentColor` through a CSS mask, so it follows the text color and the theme.
 * Paths from the backend (/media/...) are resolved against the API; /assets/... are the site's own files.
 */
export function SvgIcon({ src, className, style }: { src?: string | null; className?: string; style?: React.CSSProperties }) {
  const url = src?.startsWith("/assets/") ? src : mediaUrl(src);
  if (!url) return null;
  return (
    <span
      aria-hidden
      className={cn("inline-block size-5 shrink-0 bg-current", className)}
      style={{ mask: `url("${url}") center / contain no-repeat`, WebkitMask: `url("${url}") center / contain no-repeat`, ...style }}
    />
  );
}
