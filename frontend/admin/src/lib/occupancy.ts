export type OccupancyLevel = "low" | "medium" | "high" | "none";

/** 0–60% green, 60–80% yellow, 80–100% red; no sessions -> grey. */
export function occupancyLevel(percent: number | null | undefined): OccupancyLevel {
  if (percent === null || percent === undefined) return "none";
  if (percent < 60) return "low";
  if (percent < 80) return "medium";
  return "high";
}

export const occupancyStyles: Record<OccupancyLevel, { dot: string; text: string; ring: string }> = {
  low: { dot: "bg-success", text: "text-success", ring: "ring-success/25" },
  medium: { dot: "bg-warning", text: "text-warning", ring: "ring-warning/25" },
  high: { dot: "bg-danger", text: "text-danger", ring: "ring-danger/25" },
  none: { dot: "bg-muted/40", text: "text-muted", ring: "ring-slate-300/40" },
};
