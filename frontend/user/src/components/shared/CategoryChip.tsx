import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/cn";

type ChipCategory = { slug: string; name: string; icon_url?: string | null; color?: string | null };

const tint = (color: string) => ({ color, backgroundColor: `color-mix(in srgb, ${color} 11%, var(--surface))` });

/**
 * Category of the API with its admin-chosen color and icon.
 * - tile: pastel icon square with the name underneath (home strip)
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
  const icon = <CategoryIcon slug={category.slug} iconUrl={category.icon_url} className={variant === "tile" ? "size-[27px]" : "size-[18px]"} />;

  if (variant === "tile") {
    const body = (
      <>
        <span className="flex size-[54px] items-center justify-center rounded-2xl transition group-hover:-translate-y-0.5 sm:size-[64px]" style={tint(color)}>
          {icon}
        </span>
        <span className="line-clamp-2 text-[12px] font-bold leading-[18px] text-ink">{category.name}</span>
      </>
    );
    const cls = cn("group flex w-[64px] flex-col items-center gap-2 text-center sm:w-[80px]", className);
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
        "flex h-11 shrink-0 items-center gap-2 rounded-[14px] border px-3.5 text-[13.5px] font-bold transition",
        selected ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink hover:border-brand-500/40",
        className,
      )}
    >
      <span style={selected ? undefined : { color }}>{icon}</span>
      {category.name}
    </button>
  );
}
