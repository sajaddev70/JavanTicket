import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

/**
 * Line icon from the backend's icon set (/media/icons/...), painted with `currentColor` through a CSS mask
 * so it follows the text color and the light/dark theme.
 */
export function SvgIcon({ src, className, style }: { src?: string | null; className?: string; style?: React.CSSProperties }) {
  const url = mediaUrl(src);
  if (!url) return null;
  return (
    <span
      aria-hidden
      className={cn("inline-block size-5 shrink-0 bg-current", className)}
      style={{ mask: `url("${url}") center / contain no-repeat`, WebkitMask: `url("${url}") center / contain no-repeat`, ...style }}
    />
  );
}

/** Shortcut for icons of the shared set, e.g. <Icon name="common/plus" />. */
export function Icon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return <SvgIcon src={`/media/icons/${name}.svg`} className={className} style={style} />;
}
