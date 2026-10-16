"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, CalendarDays, LayoutGrid, List, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useCategories, useCities, usePageBlock } from "@/hooks/useContent";
import { useCity } from "@/providers/CityProvider";
import { useEventSearch } from "./hooks";
import { apiFilters, readFilters, SORT_OPTIONS, TYPE_OPTIONS, WHEN_OPTIONS } from "./filters";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SmartImage } from "@/components/ui/SmartImage";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { errorMessage } from "@/services/api";
import { faNumber, toEnDigits } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

export function EventsBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { cityId: headerCity } = useCity();
  const filters = readFilters((k) => params.get(k), headerCity);
  const events = useEventSearch(apiFilters(filters));
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  const activeCount = [filters.section, filters.when, filters.minPrice, filters.maxPrice, filters.cityParam].filter((v) => v !== "" && v !== null).length;

  const filterControls = () => (
    <>
      <Select aria-label="نوع رویداد" value={filters.section} onChange={(e) => update({ type: e.target.value })} icon={<Sparkles className="size-[18px]" />} label="نوع رویداد">
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <CityFilter value={filters.cityId ? String(filters.cityId) : "all"} onChange={(v) => update({ city: v })} />
      <Select aria-label="تاریخ برگزاری" value={filters.when} onChange={(e) => update({ when: e.target.value })} icon={<CalendarDays className="size-[18px]" />} label="تاریخ برگزاری">
        {WHEN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <PriceRange min={filters.minPrice ?? null} max={filters.maxPrice ?? null} onChange={(min, max) => update({ min, max })} />
    </>
  );

  return (
    <>
      <PageHeader />
      <div className="container-page space-y-4 pb-8 pt-4">
        <CategoryTabs active={filters.category ?? ""} onChange={(slug) => update({ category: slug })} />

        <div className="card p-3 sm:p-4">
          <div className="flex flex-wrap items-end gap-3">
            <form
              role="search"
              className="relative min-w-0 flex-1 basis-full lg:basis-[260px]"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
              }}
            >
              <label htmlFor="events-q" className="sr-only">
                جستجو در عنوان رویدادها
              </label>
              <input
                key={filters.q}
                id="events-q"
                name="q"
                type="search"
                enterKeyHint="search"
                defaultValue={filters.q}
                placeholder="جستجو در عنوان رویدادها ..."
                className="min-h-12 w-full rounded-xl border border-line bg-field pl-12 pr-4 text-[14px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
              />
              <button type="submit" aria-label="جستجو" className="absolute left-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-2 hover:text-brand-600">
                <Search className="size-5" />
              </button>
            </form>
            <div className="hidden flex-[3] grid-cols-4 gap-3 lg:grid">{filterControls()}</div>
            <Select
              aria-label="مرتب‌سازی"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
              icon={<ArrowUpDown className="size-[18px]" />}
              label="مرتب‌سازی"
              className="min-w-0 flex-1 lg:max-w-[190px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => setFiltersOpen(true)} className="min-h-12 flex-1 lg:hidden" aria-haspopup="dialog">
              <SlidersHorizontal className="size-5" />
              فیلترها
              {activeCount > 0 && <span className="rounded-full bg-brand-600 px-2 text-[12px] text-white">{faNumber(activeCount)}</span>}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[16px] font-black text-ink" aria-live="polite">
            {events.isLoading ? (
              "در حال جستجو ..."
            ) : (
              <>
                <span className="text-[19px] text-brand-600">{faNumber(total)}</span> رویداد یافت شد
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            {(filters.q || filters.category || activeCount > 0) && (
              <button type="button" onClick={() => router.push(pathname)} className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold text-danger-fg hover:bg-danger-bg">
                <X className="size-4" />
                حذف فیلترها
              </button>
            )}
            <div className="flex rounded-xl border border-line bg-surface p-1" role="group" aria-label="نحوه نمایش">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ view: v === "grid" ? "" : v, page: filters.page })}
                  aria-pressed={filters.view === v}
                  aria-label={v === "grid" ? "نمایش شبکه‌ای" : "نمایش فهرستی"}
                  className={cn("flex size-10 items-center justify-center rounded-lg sm:size-9", filters.view === v ? "bg-brand-50 text-brand-600" : "text-muted hover:text-ink")}
                >
                  {v === "grid" ? <LayoutGrid className="size-5" /> : <List className="size-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

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
          <div
            className={cn(
              "transition-opacity",
              events.isFetching && events.isPlaceholderData && "opacity-60",
              filters.view === "grid" ? "grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6" : "grid grid-cols-1 gap-3 xl:grid-cols-2",
            )}
          >
            {events.isLoading
              ? Array.from({ length: 12 }, (_, i) => <EventCardSkeleton key={i} variant={filters.view === "grid" ? "grid" : "featured"} />)
              : events.data!.items.map((event, i) => <EventCard key={event.id} event={event} variant={filters.view === "grid" ? "grid" : "row"} priority={i < 4} />)}
          </div>
        )}

        <Pagination page={filters.page ?? 1} pages={pages} onChange={(page) => update({ page: page === 1 ? null : page })} className="pt-2" />
      </div>

      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="فیلتر رویدادها"
        footer={
          <Button block size="lg" onClick={() => setFiltersOpen(false)}>
            مشاهده {faNumber(total)} رویداد
          </Button>
        }
      >
        <div className="space-y-4">{filterControls()}</div>
      </Dialog>
    </>
  );
}

function PageHeader() {
  const { block } = usePageBlock("EVENTS_HERO");
  return (
    <section className="container-page pt-4">
      <div className="relative overflow-hidden rounded-[20px] bg-navy-950 text-white">
        <div className="absolute inset-0">
          <SmartImage src={mediaUrl(block?.image_url)} fallback={null} alt="" fill preload sizes="100vw" className="object-cover opacity-70" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-[#071834] via-[#071834]/80 to-[#071834]/30" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-7">
          <Breadcrumb tone="light" items={[{ label: "خانه", href: "/" }, { label: "رویدادها" }]} />
          <h1 className="mt-2 text-[26px] font-black sm:text-[30px]">رویدادها</h1>
          {(block?.subtitle || block?.title) && <p className="mt-1 text-[14px] text-white/85 sm:text-[15px]">{block?.subtitle ?? block?.title}</p>}
        </div>
      </div>
    </section>
  );
}

function CategoryTabs({ active, onChange }: { active: string; onChange: (slug: string) => void }) {
  const { data: categories } = useCategories();
  const items = [{ slug: "", name: "همه رویدادها", icon_url: null, color: null }, ...(categories ?? [])];
  return (
    <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 py-1" role="group" aria-label="دسته‌بندی رویدادها">
      {items.map((c) => {
        const on = c.slug === active;
        const color = c.color ?? "#1463e6";
        return (
          <button
            key={c.slug || "all"}
            type="button"
            onClick={() => onChange(c.slug)}
            aria-pressed={on}
            className={cn(
              "flex h-[76px] w-[112px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border text-[13px] font-bold transition sm:w-[120px]",
              on ? "border-brand-600 bg-brand-600 text-white shadow-cta" : "border-line bg-surface text-ink hover:border-brand-500/40",
            )}
          >
            <span style={on ? undefined : { color }}>
              {c.slug ? <CategoryIcon slug={c.slug} iconUrl={c.icon_url} className="size-7" /> : <LayoutGrid className="size-7" />}
            </span>
            <span className="line-clamp-1 px-1">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function CityFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: cities } = useCities();
  return (
    <Select aria-label="شهر" value={value} onChange={(e) => onChange(e.target.value)} icon={<MapPin className="size-[18px]" />} label="شهر">
      <option value="all">همه شهرها</option>
      {cities?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
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
  const field = "min-h-12 w-full min-w-0 rounded-xl border border-line-strong bg-surface px-3 text-center text-[14px] text-ink outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10";
  return (
    <form
      key={`${min}-${max}`}
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
      <span className="mb-2 block text-[13px] font-semibold text-ink">محدوده قیمت (تومان)</span>
      <div className="flex items-center gap-1.5">
        <input name="min" inputMode="numeric" defaultValue={min ?? ""} placeholder="از" aria-label="حداقل قیمت" className={field} />
        <span className="text-muted" aria-hidden>
          -
        </span>
        <input name="max" inputMode="numeric" defaultValue={max ?? ""} placeholder="تا" aria-label="حداکثر قیمت" className={field} />
        <button type="submit" className="sr-only">
          اعمال قیمت
        </button>
      </div>
    </form>
  );
}
