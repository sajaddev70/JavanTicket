'use client';

import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { useCities, useFeatures, usePageBlocks } from "@/hooks/usePublicData";
import { useCityStore } from "@/stores/useCityStore";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { mediaUrl } from "@/lib/media";

/** Homepage hero (HOME_HERO block): headline, event search and the "why buy from us" features. */
export function HomeHero() {
  const router = useRouter();
  const { data: blocks, isLoading } = usePageBlocks();
  const { data: cities } = useCities();
  const { data: features } = useFeatures();
  const { cityId, setCityId } = useCityStore();
  const hero = blocks?.HOME_HERO;

  if (isLoading) return <Skeleton className="aspect-[16/12] w-full rounded-[22px] sm:aspect-[1414/280]" />;
  if (!hero) return null;

  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/events${params.size ? `?${params}` : ""}`);
  }

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-navy-950 text-white shadow-float">
      <div className="absolute inset-y-0 left-0 w-full sm:w-[62%]">
        <SmartImage src={mediaUrl(hero.image_url)} fallback={null} alt="" fill preload sizes="(min-width: 1024px) 900px, 100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#06142e] via-[#06142e]/85 to-[#06142e]/30 sm:bg-gradient-to-l sm:from-[#06142e] sm:from-35% sm:via-[#06142e]/80 sm:via-55% sm:to-transparent" />

      <div className="relative flex min-h-[360px] flex-col justify-end gap-5 p-5 sm:min-h-[300px] sm:justify-center sm:p-10 lg:pr-14">
        <div className="max-w-[640px]">
          {hero.kicker && <p className="text-[14px] font-medium tracking-wide text-white/80">{hero.kicker}</p>}
          {hero.title && <h1 className="mt-2 text-[26px] font-black leading-[1.35] sm:text-[34px] lg:text-[40px]">{hero.title}</h1>}
          {hero.subtitle && <p className="mt-2 text-[15px] text-white/85 sm:text-[18px]">{hero.subtitle}</p>}
        </div>

        <form onSubmit={search} role="search" className="flex w-full max-w-[720px] flex-col gap-2 rounded-2xl bg-surface p-2 shadow-float sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">جستجو</span>
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-ink/60" />
            <input
              name="q"
              type="search"
              placeholder="جستجو در رویدادها، هنرمندان، سالن‌ها و ..."
              className="h-12 w-full rounded-xl border border-line bg-surface pr-11 pl-3 text-[14px] text-ink outline-none placeholder:text-muted focus:border-brand-500/50"
            />
          </label>
          <label className="relative sm:w-44">
            <span className="sr-only">شهر</span>
            <MapPin className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink/70" />
            <select
              value={cityId ?? ""}
              onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
              className="h-12 w-full appearance-none rounded-xl border border-line bg-surface pr-10 pl-9 text-[14px] font-bold text-ink outline-none"
            >
              <option value="">همه شهرها</option>
              {cities?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          </label>
          <button type="submit" className="h-12 rounded-xl bg-brand-600 px-8 text-[15px] font-bold text-white hover:bg-brand-700">
            جستجو
          </button>
        </form>

        {!!features?.length && (
          <ul className="flex flex-wrap gap-x-7 gap-y-2 text-[13.5px] text-white/90">
            {features.map((f) => (
              <li key={f.id} className="flex items-center gap-2" title={f.description ?? undefined}>
                <SvgIcon src={f.icon_url} className="size-5" />
                {f.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
