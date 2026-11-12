import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/cn";

type ChipCategory = { slug: string; name: string; icon_url?: string | null; color?: string | null };

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
  const icon = <CategoryIcon slug={category.slug} iconUrl={category.icon_url} className="size-[18px]" />;

  if (variant === "tile") {
    // Pastel tile in the category color with the icon and the name inside (reference 01).
    const body = (
      <>
        <span className="flex size-11 items-center justify-center transition group-hover:-translate-y-0.5" style={{ color }}>
          <CategoryIcon slug={category.slug} iconUrl={category.icon_url} className="size-[30px]" />
        </span>
        <span className="line-clamp-2 px-1 text-[12px] font-black leading-[17px] text-ink">{category.name}</span>
      </>
    );
    const cls = cn(
      "group flex h-[100px] w-[84px] flex-col items-center justify-center gap-1 rounded-[20px] border border-white/60 text-center shadow-card transition hover:-translate-y-0.5 dark:border-white/5 sm:h-[104px] sm:w-[92px]",
      className,
    );
    const style = { backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${color} 22%, var(--surface)), color-mix(in srgb, ${color} 8%, var(--surface)))` };
    return href ? (
      <Link href={href} className={cls} style={style}>
        {body}
      </Link>
    ) : (
      <button type="button" onClick={onClick} className={cls} style={style}>
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
        "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[13.5px] font-bold transition",
        selected ? "bg-grad-primary glow-primary border-transparent text-white" : "border-line bg-surface text-ink hover:border-brand-500/40",
        className,
      )}
    >
      <span style={selected ? undefined : { color }}>{icon}</span>
      {category.name}
    </button>
  );
}
