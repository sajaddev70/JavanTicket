import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/cn";

type ChipCategory = { slug: string; name: string; icon_url?: string | null; color?: string | null };

/**
 * Category of the API with its admin-chosen color and icon.
 * - tile: link pill with the icon in the category's color (home strip)
 * - chip: compact pill for filters (events page); `selected` fills it with the primary color
 */
export function CategoryChip({
  category,
  variant = "tile",
  href,
  selected,
  onClick,
  className,
}: {
  category: ChipCategory;
  variant?: "tile" | "chip";
  href?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const color = category.color ?? "#1268E8";
  const icon = <CategoryIcon slug={category.slug} iconUrl={category.icon_url} className={variant === "tile" ? "size-4" : "size-4"} />;

  if (variant === "tile") {
    const body = (
      <>
        <span style={{ color }}>{icon}</span>
        {category.name}
      </>
    );
    const cls = cn("flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-field px-[13px] text-[12px] text-ink", className);
    return href ? (
      <Link href={href} className={cls}>
        {body}
      </Link>
    ) : (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-[13px] text-[12px] transition",
        selected ? "bg-chip font-bold text-white" : "border border-line-strong bg-field text-ink",
        className,
      )}
    >
      <span style={selected ? undefined : { color }}>{icon}</span>
      {category.name}
    </button>
  );
}
