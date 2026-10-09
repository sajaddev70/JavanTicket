import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

export function Badge({ tone = "muted", children }: { tone?: "success" | "warning" | "danger" | "brand" | "muted"; children: React.ReactNode }) {
  const tones = {
    success: "bg-success/10 text-success-fg border-success/25",
    warning: "bg-warning/10 text-warning-fg border-warning/30",
    danger: "bg-danger/10 text-danger-fg border-danger/25",
    brand: "bg-brand-50 text-brand-600 border-brand-500/25",
    muted: "bg-surface-2 text-muted border-line",
  };
  return <span className={cn("inline-flex h-7 items-center whitespace-nowrap rounded-lg border px-2.5 text-xs font-bold", tones[tone])}>{children}</span>;
}

export function ActiveBadge({ active }: { active: unknown }) {
  return active === false ? <Badge>غیرفعال</Badge> : <Badge tone="success">فعال</Badge>;
}

/** Small preview of an image stored in the database. */
export function Thumb({ src, className }: { src?: unknown; className?: string }) {
  const url = mediaUrl(typeof src === "string" ? src : null);
  if (!url) return <span className="text-muted">—</span>;
  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded / remote image
  return <img src={url} alt="" className={cn("h-10 w-16 rounded-lg border border-line bg-field object-contain", className)} />;
}

export function ColorDot({ color }: { color?: unknown }) {
  if (typeof color !== "string" || !color) return <span className="text-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-2" dir="ltr">
      <span className="size-4 rounded-full border border-line" style={{ background: color }} />
      {color}
    </span>
  );
}
