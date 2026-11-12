"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid, X } from "lucide-react";
import { useCategories, useCities, usePageBlock } from "@/hooks/useContent";
import { useCity } from "@/providers/CityProvider";
import { useEventSearch } from "./hooks";
import { apiFilters, readFilters, SORT_OPTIONS, TYPE_OPTIONS, WHEN_OPTIONS } from "./filters";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { Pagination } from "@/components/ui/Pagination";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { OptionSheet } from "@/components/ui/OptionSheet";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { errorMessage } from "@/services/api";
import { faNumber, toEnDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

type Sheet = "category" | "city" | "when" | "sort" | "more" | null;

/**
 * Events list (reference 02): title, filter chips each opening a bottom sheet, event cards and server paging.
 * Every filter lives in the URL (/events?q=&category=&city=&when=&type=&min=&max=&sort=&page=), see ./filters.
 */
export function EventsBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { cityId: headerCity } = useCity();
  const filters = readFilters((k) => params.get(k), headerCity);
  const events = useEventSearch(apiFilters(filters));
  const { data: categories } = useCategories();
  const { data: cities } = useCities();
  const { block } = usePageBlock("EVENTS_HERO");
  const [sheet, setSheet] = useState<Sheet>(null);

  /** Writes filter changes to the URL; any change other than paging goes back to page 1. */
  function update(next: Record<string, string | number | null | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === undefined || v === "") p.delete(k);
      else p.set(k, String(v));
    }
    if (!("page" in next)) p.delete("page");
    router.push(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: "page" in next });
  }

  const total = events.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (filters.size ?? 12)));
  const category = categories?.find((c) => c.slug === filters.category);
  const city = cities?.find((c) => c.id === filters.cityId);
  const moreCount = [filters.section, filters.minPrice, filters.maxPrice].filter((v) => v !== "" && v !== null && v !== undefined).length;
  const anyFilter = !!(filters.q || filters.category || filters.cityParam || filters.when || moreCount || filters.sort !== "newest");

  const chips: { key: Exclude<Sheet, null | "more">; label: string; icon: React.ReactNode; active: boolean }[] = [
    { key: "category", label: category?.name ?? "همه دسته‌ها", icon: <LayoutGrid className="size-[18px]" />, active: !!category },
    { key: "city", label: city?.name ?? "شهر", icon: <Icon name="common/location" className="size-[18px]" />, active: !!filters.cityParam },
    { key: "when", label: WHEN_OPTIONS.find((o) => o.value === filters.when && o.value)?.label ?? "تاریخ", icon: <Icon name="common/calendar-simple" className="size-[18px]" />, active: !!filters.when },
    { key: "sort", label: filters.sort === "newest" ? "مرتب‌سازی" : SORT_OPTIONS.find((o) => o.value === filters.sort)!.label, icon: <ChevronDown className="size-4" />, active: filters.sort !== "newest" },
  ];

  const glassChip = (active: boolean) =>
    cn(
      "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-bold transition",
      active ? "bg-grad-primary glow-primary text-white" : "glass hover:bg-white/20",
    );

  return (
    <div className="container-page pb-8 pt-2 lg:pt-6">
      {/* Title on the band: desktop only — phones open straight on search and filters (reference 02) */}
      <div className="hidden flex-wrap items-end justify-between gap-3 text-white lg:flex">
        <div className="min-w-0">
          <h1 className="text-[30px] font-black leading-[1.4]">{category?.name ?? "همه رویدادها"}</h1>
          {(category?.tagline || block?.subtitle) && <p className="mt-1 text-[14px] leading-7 text-white/80">{category?.tagline ?? block?.subtitle}</p>}
        </div>
      </div>
      <h1 className="sr-only lg:hidden">{category?.name ?? "همه رویدادها"}</h1>

      {/* Category pills: همه، نمایشگاه، همایش، کنسرت ... */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0 lg:mt-4" role="group" aria-label="دسته‌بندی">
        <button type="button" aria-pressed={!filters.category} onClick={() => update({ category: null })} className={glassChip(!filters.category)}>
          همه
        </button>
        {(categories ?? []).map((c) => (
          <button key={c.slug} type="button" aria-pressed={filters.category === c.slug} onClick={() => update({ category: c.slug })} className={glassChip(filters.category === c.slug)}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Filter chips: city, date, sort, more — each opens a bottom sheet */}
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0" role="group" aria-label="فیلتر رویدادها">
        {chips
          .filter((c) => c.key !== "category")
          .map((c) => (
            <button key={c.key} type="button" onClick={() => setSheet(c.key)} aria-haspopup="dialog" className={glassChip(c.active)}>
              {c.key !== "sort" && c.icon}
              <span className="max-w-[140px] truncate">{c.label}</span>
              {c.key === "sort" && c.icon}
            </button>
          ))}
        <button type="button" onClick={() => setSheet("more")} aria-haspopup="dialog" className={glassChip(moreCount > 0)}>
          <Icon name="common/filter" className="size-[18px]" />
          فیلترها
          {moreCount > 0 && <span className="rounded-full bg-white/25 px-1.5 text-[11px]">{faNumber(moreCount)}</span>}
        </button>
        {filters.q && (
          <button type="button" onClick={() => update({ q: null })} className={glassChip(false)}>
            جستجو: <span className="max-w-[120px] truncate">{filters.q}</span>
            <X className="size-4" aria-label="حذف جستجو" />
          </button>
        )}
        {anyFilter && (
          <button type="button" onClick={() => router.push(pathname)} className={cn(glassChip(false), "text-[#ffc2cd]")}>
            <X className="size-4" />
            حذف فیلترها
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {events.isLoading ? "در حال جستجو ..." : `${faNumber(total)} رویداد`}
      </p>

      <div className="mt-4 lg:mt-6">
        {events.isError ? (
          <ErrorState message={errorMessage(events.error)} onRetry={() => events.refetch()} />
        ) : !events.isLoading && !events.data?.items.length ? (
          <EmptyState
            message="رویدادی با این شرایط پیدا نشد."
            description="فیلترها را تغییر دهید یا شهر دیگری را انتخاب کنید."
            action={
              <Button variant="soft" onClick={() => router.push(pathname)}>
                مشاهده همه رویدادها
              </Button>
            }
          />
        ) : (
          <div className={cn("grid gap-3 transition-opacity sm:gap-4 md:grid-cols-2 xl:grid-cols-3", events.isFetching && events.isPlaceholderData && "opacity-60")}>
            {events.isLoading
              ? Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} variant="row" />)
              : events.data!.items.map((event, i) => <EventCard key={event.id} event={event} variant="row" priority={i < 2} />)}
          </div>
        )}
      </div>

      <Pagination page={filters.page ?? 1} pages={pages} onChange={(page) => update({ page: page === 1 ? null : page })} className="pt-6" />

      <OptionSheet
        open={sheet === "category"}
        onClose={() => setSheet(null)}
        title="دسته‌بندی"
        value={filters.category ?? ""}
        onChange={(v) => update({ category: v })}
        options={[
          { value: "", label: "همه دسته‌ها", icon: <LayoutGrid className="size-5 text-ink-2" /> },
          ...(categories ?? []).map((c) => ({
            value: c.slug,
            label: c.name,
            hint: c.events_count ? `${faNumber(c.events_count)} رویداد` : undefined,
            icon: (
              <span style={{ color: c.color ?? undefined }}>
                <CategoryIcon slug={c.slug} iconUrl={c.icon_url} className="size-5" />
              </span>
            ),
          })),
        ]}
      />
      <OptionSheet
        open={sheet === "city"}
        onClose={() => setSheet(null)}
        title="شهر"
        value={filters.cityId ? String(filters.cityId) : "all"}
        onChange={(v) => update({ city: v })}
        options={[{ value: "all", label: "همه شهرها" }, ...(cities ?? []).map((c) => ({ value: String(c.id), label: c.name, hint: c.events_count ? `${faNumber(c.events_count)} رویداد` : undefined }))]}
      />
      <OptionSheet open={sheet === "when"} onClose={() => setSheet(null)} title="تاریخ برگزاری" value={filters.when ?? ""} onChange={(v) => update({ when: v })} options={WHEN_OPTIONS} />
      <OptionSheet
        open={sheet === "sort"}
        onClose={() => setSheet(null)}
        title="مرتب‌سازی"
        value={filters.sort ?? "newest"}
        onChange={(v) => update({ sort: v === "newest" ? "" : v })}
        options={SORT_OPTIONS}
      />
      <Dialog
        open={sheet === "more"}
        onClose={() => setSheet(null)}
        title="فیلترهای بیشتر"
        footer={
          <Button block size="lg" onClick={() => setSheet(null)}>
            مشاهده {faNumber(total)} رویداد
          </Button>
        }
      >
        <fieldset>
          <legend className="mb-2.5 text-[14px] font-bold text-ink">نوع رویداد</legend>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={filters.section === o.value}
                onClick={() => update({ type: o.value })}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-[13.5px] font-bold",
                  filters.section === o.value ? "border-brand-600 bg-brand-50 text-brand-600" : "border-line text-ink-2",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <PriceRange min={filters.minPrice ?? null} max={filters.maxPrice ?? null} onChange={(min, max) => update({ min, max })} />
      </Dialog>
    </div>
  );
}

/** Starting-price range in Toman; applied on Enter or when leaving the fields. */
function PriceRange({ min, max, onChange }: { min: number | null; max: number | null; onChange: (min: number | null, max: number | null) => void }) {
  const parse = (v: string) => {
    const n = Number(toEnDigits(v).replace(/[^\d]/g, ""));
    return v.trim() && Number.isFinite(n) ? n : null;
  };
  const commit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const nextMin = parse(String(data.get("min") ?? ""));
    const nextMax = parse(String(data.get("max") ?? ""));
    if (nextMin !== min || nextMax !== max) onChange(nextMin, nextMax);
  };
  const field =
    "h-12 w-full min-w-0 rounded-full border border-line bg-field px-3 text-center text-[14px] text-ink outline-none focus:border-brand-500/60 focus:bg-surface focus:ring-4 focus:ring-brand-500/10";
  return (
    <form
      key={`${min}-${max}`}
      className="mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        commit(e.currentTarget);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) commit(e.currentTarget);
      }}
      role="group"
      aria-label="محدوده قیمت (تومان)"
    >
      <span className="mb-2.5 block text-[14px] font-bold text-ink">محدوده قیمت (تومان)</span>
      <div className="flex items-center gap-2">
        <input name="min" inputMode="numeric" defaultValue={min ?? ""} placeholder="از" aria-label="حداقل قیمت" className={field} />
        <span className="text-muted" aria-hidden>
          تا
        </span>
        <input name="max" inputMode="numeric" defaultValue={max ?? ""} placeholder="تا" aria-label="حداکثر قیمت" className={field} />
        <button type="submit" className="sr-only">
          اعمال قیمت
        </button>
      </div>
    </form>
  );
}
