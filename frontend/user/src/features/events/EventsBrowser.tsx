"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, X } from "lucide-react";
import { useCategories, useCities, usePageBlock } from "@/hooks/useContent";
import { useCity } from "@/providers/CityProvider";
import { useEventSearch } from "./hooks";
import { apiFilters, readFilters, SORT_OPTIONS, TYPE_OPTIONS, WHEN_OPTIONS } from "./filters";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { Pagination } from "@/components/ui/Pagination";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SearchField } from "@/components/layout/SearchField";
import { LoadingOverlay, SYMBOL } from "@/components/feedback/StateDialog";
import { OptionSheet } from "@/components/ui/OptionSheet";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { errorMessage } from "@/services/api";
import { faNumber, toEnDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

type Sheet = "city" | "when" | "sort" | "more" | null;

/**
 * 05 همه رویدادها: عادی، نتیجه جست‌وجو، بدون نتیجه، بارگذاری. Search, category and filter chips, event cards and server paging.
 * Every filter lives in the URL (/events?q=&category=&city=&when=&type=&min=&max=&sort=&page=), see ./filters.
 */
const chip = (on: boolean) =>
  cn("flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-[13px] text-[12px] transition", on ? "bg-chip font-bold text-white" : "border border-line-strong bg-field text-ink");

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

  const chips: { key: Exclude<Sheet, null | "more" | "category">; label: string; icon: React.ReactNode; active: boolean }[] = [
    { key: "city", label: city?.name ?? "همه شهرها", icon: <Icon name="common/location" className="size-4" />, active: !!filters.cityParam },
    { key: "when", label: WHEN_OPTIONS.find((o) => o.value === filters.when && o.value)?.label ?? "تاریخ", icon: <Icon name="common/calendar-simple" className="size-4" />, active: !!filters.when },
    { key: "sort", label: filters.sort === "newest" ? "مرتب‌سازی" : SORT_OPTIONS.find((o) => o.value === filters.sort)!.label, icon: <ArrowUpDown className="size-4" />, active: filters.sort !== "newest" },
  ];

  return (
    <>
    <PageTopBar title={category?.name ?? "همه رویدادها"} subtitle={category?.tagline ?? block?.subtitle ?? undefined} noBack />
    <div className="container-page pb-8 pt-1.5">
      <SearchField key={filters.q ?? ""} defaultValue={filters.q ?? ""} onSearch={(q) => update({ q })} />

      {!filters.q && (
        <>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="دسته‌بندی رویدادها">
            <button type="button" aria-pressed={!filters.category} onClick={() => update({ category: "" })} className={chip(!filters.category)}>
              همه
            </button>
            {(categories ?? []).map((c) => (
              <button key={c.id} type="button" aria-pressed={c.slug === filters.category} onClick={() => update({ category: c.slug })} className={chip(c.slug === filters.category)}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="فیلتر رویدادها">
            {chips.map((c) => (
              <button key={c.key} type="button" onClick={() => setSheet(c.key)} aria-haspopup="dialog" className={chip(c.active)}>
                {c.icon}
                <span className="max-w-[140px] truncate">{c.label}</span>
              </button>
            ))}
            <button type="button" onClick={() => setSheet("more")} aria-haspopup="dialog" className={chip(moreCount > 0)}>
              <Icon name="common/sliders" className="size-4" />
              فیلترها
              {moreCount > 0 && <span>({faNumber(moreCount)})</span>}
            </button>
          </div>
        </>
      )}

      <div className="mb-[9px] mt-[19px] flex min-h-7 items-center justify-between gap-3">
        <p className="text-[15px] font-black text-ink" aria-live="polite">
          {filters.q ? "نتایج جست‌وجو" : events.isLoading ? "در حال جست‌وجو ..." : `${faNumber(total)} رویداد`}
        </p>
        {anyFilter ? (
          <button type="button" onClick={() => router.push(pathname)} className="flex min-h-11 items-center gap-1 text-[12px] font-bold text-danger-fg">
            <X className="size-4" />
            حذف فیلترها
          </button>
        ) : (
          <span className="text-[11px] text-muted">پیشنهادی برای شما</span>
        )}
      </div>

      {events.isFetching && events.isPlaceholderData && <LoadingOverlay title="در حال بارگذاری" message="لطفاً چند لحظه منتظر بمانید." />}
      {events.isError ? (
        <ErrorState message={errorMessage(events.error)} onRetry={() => events.refetch()} />
      ) : !events.isLoading && !events.data?.items.length ? (
        <EmptyState
          symbol={SYMBOL.search}
          message="نتیجه‌ای پیدا نشد"
          description="فیلترها را تغییر دهید یا عبارت دیگری جست‌وجو کنید."
          action={
            <Button size="xl" onClick={() => router.push(pathname)}>
              مشاهده رویدادها
            </Button>
          }
        />
      ) : (
        <div className="grid gap-[11px] lg:grid-cols-2">
          {events.isLoading
            ? Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} />)
            : events.data!.items.map((event, i) => <EventCard key={event.id} event={event} priority={i < 2} />)}
        </div>
      )}

      <Pagination page={filters.page ?? 1} pages={pages} onChange={(page) => update({ page: page === 1 ? null : page })} className="pt-6" />

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
                  "min-h-11 rounded-xl border px-4 text-[13.5px] font-bold",
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
    </>
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
    "h-12 w-full min-w-0 rounded-xl border border-line bg-field px-3 text-center text-[14px] text-ink outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10";
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
