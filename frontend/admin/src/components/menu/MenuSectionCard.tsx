import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { AdminMenuSection } from "@/services/admin";
import { MenuItemIcon } from "@/components/layout/MenuItemIcon";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

type SectionTone = "amber" | "blue" | "red" | "green" | "purple" | "mint" | "sky" | "pink";

// Alpha tints so the bands read correctly on both light and dark surfaces.
const TONES: Record<SectionTone, { band: string; icon: string }> = {
  amber: { band: "from-amber-400/20 to-amber-400/5", icon: "text-warning" },
  blue: { band: "from-brand-500/18 to-brand-500/5", icon: "text-brand-600" },
  red: { band: "from-rose-500/18 to-rose-500/5", icon: "text-danger" },
  mint: { band: "from-emerald-400/20 to-emerald-400/5", icon: "text-ink" },
  purple: { band: "from-violet-500/18 to-violet-500/5", icon: "text-violet-500" },
  green: { band: "from-green-500/18 to-green-500/5", icon: "text-ink" },
  sky: { band: "from-sky-500/18 to-sky-500/5", icon: "text-ink" },
  pink: { band: "from-pink-500/18 to-pink-500/5", icon: "text-ink" },
};

export function MenuSectionCard({ section }: { section: AdminMenuSection }) {
  const tone = TONES[section.tone as SectionTone] ?? TONES.blue;
  const tile = mediaUrl(section.tile_url);
  return (
    <article className={cn("rounded-2xl border border-line/70 bg-surface p-3 shadow-card", section.tall && "xl:row-span-2")}>
      <header className={cn("flex items-center justify-between gap-3 rounded-xl bg-gradient-to-l px-4 py-3.5", tone.band)}>
        <div className="min-w-0">
          <h2 className="text-[19px] font-black text-ink">{section.title}</h2>
          {section.description && <p className="mt-1 truncate text-[13px] text-muted">{section.description}</p>}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- artwork served by the backend */}
        {tile && <img src={tile} alt="" width={58} height={58} className="size-[58px] shrink-0 object-contain" />}
      </header>

      <ul className="mt-2.5 space-y-2">
        {section.items.map((item) => {
          return (
            <li key={item.key}>
              <Link
                href={item.path}
                className="group flex min-h-[60px] items-center gap-3 rounded-xl border border-line/70 bg-surface px-4 py-2.5 transition hover:border-brand-500/30 hover:bg-brand-50/50"
              >
                <MenuItemIcon icon={item.icon} className={cn("size-6", tone.icon)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold text-ink">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-muted">{item.description}</span>
                </span>
                <ChevronLeft className="size-5 shrink-0 text-ink/50 transition group-hover:-translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
