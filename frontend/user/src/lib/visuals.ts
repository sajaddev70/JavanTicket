import type { CSSProperties } from "react";

const DEFAULT_COLOR = "#2f80f5";

/** Solid badge in the category color chosen in the admin panel. */
export function categoryBadge(color?: string | null): CSSProperties {
  return { backgroundColor: color || DEFAULT_COLOR };
}
