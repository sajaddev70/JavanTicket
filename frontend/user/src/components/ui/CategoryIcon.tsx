import { SvgIcon } from "./SvgIcon";

/** Line icons shipped with the site for the usual category kinds, used when a category has no icon of its own. */
const FALLBACKS: Record<string, string> = {
  music: "music",
  concert: "music",
  theater: "theater",
  conference: "conference",
  workshop: "education",
  education: "education",
  sports: "sports",
  exhibition: "exhibition",
  kids: "children",
  children: "children",
  family: "family",
  business: "business",
  technology: "technology",
};

export function categoryIconSrc(slug?: string | null, iconUrl?: string | null): string {
  if (iconUrl) return iconUrl;
  return `/assets/icons/categories/${FALLBACKS[slug ?? ""] ?? "other"}.svg`;
}

/** Category icon painted in the current text color: the admin's icon (icon_url) or the slug's fallback. */
export function CategoryIcon({ slug, iconUrl, className }: { slug?: string | null; iconUrl?: string | null; className?: string }) {
  return <SvgIcon src={categoryIconSrc(slug, iconUrl)} className={className} />;
}
