'use client';

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, MapPin, MoreHorizontal, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { EventCard, EventCardSkeleton } from "@/components/home/EventCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SmartImage } from "@/components/ui/SmartImage";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useCategories, useCities, useEventSearch, usePageBlocks } from "@/hooks/usePublicData";
import { useCityStore } from "@/stores/useCityStore";
import { faNumber } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;
const WHEN = [
  { value: "", label: "همه زمان‌ها" },
  { value: "today", label: "امروز" },
  { value: "week", label: "این هفته" },
  { value: "month", label: "این ماه" },
];
const SORTS = [
  { value: "newest", label: "جدیدترین" },
  { value: "soonest", label: "نزدیک‌ترین زمان" },
  { value: "price", label: "ارزان‌ترین" },
];
const VISIBLE_CATEGORIES = 6;

export default function EventsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />
      <main className="flex-1">
        <Suspense>
          <EventsBrowser />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

function EventsBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hero = usePageBlocks().data?.EVENTS_HERO;
  const categories = useCategories().data ?? [];
  const cities = useCities().data ?? [];
  const { cityId, setCityId } = useCityStore();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [allCategories, setAllCategories] = useState(false);

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const when = params.get("when") ?? "";
  const sort = params.get("sort") ?? (params.get("section") === "this-week" ? "soonest" : "newest");
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const section = params.get("section") ?? "";
  const events = useEventSearch({
    q,
    category,
    when: when || (section === "this-week" ? "week" : ""),
    section: section === "featured" || section === "popular" ? section : null,
    sort,
    page,
    size: PAGE_SIZE,
  });

  function update(next: Record<string, string>) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!("page" in next)) p.delete("page");
    p.delete("section");
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  }

  const total = events.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(total, page * PAGE_SIZE);
  const shown = allCategories ? categories : categories.slice(0, VISIBLE_CATEGORIES);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-y-0 left-0 w-full md:w-[60%]">
          <SmartImage src={mediaUrl(hero?.image_url)} fallback={null} alt="" fill preload sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#06142e] to-[#06142e]/60 md:bg-gradient-to-l md:from-[#06142e] md:from-40% md:via-[#06142e]/75 md:to-transparent" />
        <div className="relative mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:pb-28 sm:pt-12 lg:px-10">
          <div className="max-w-[640px]">
            {hero?.title && <h1 className="text-[28px] font-black leading-[1.4] sm:text-[38px]">{hero.title}</h1>}
            {hero?.subtitle && <p className="mt-3 text-[15px] leading-8 text-white/85 sm:text-[18px]">{hero.subtitle}</p>}
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-16 max-w-[1440px] px-3 sm:-mt-20 sm:px-4 lg:px-10">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
          }}
          className="grid grid-cols-1 gap-2 rounded-2xl border border-line bg-surface p-3 shadow-float sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">جستجو</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-ink/60" />
            <input
              key={q}
              name="q"
              type="search"
              defaultValue={q}
              placeholder="نام رویداد، موضوع یا برگزارکننده را جستجو کنید ..."
              className="h-14 w-full rounded-xl border border-line bg-field pr-12 pl-4 text-[14px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface"
            />
          </label>
          <SelectBox icon={<MapPin className="size-5" />} value={cityId ? String(cityId) : ""} onChange={(v) => setCityId(v ? Number(v) : null)} label="شهر">
            <option value="">همه شهرها</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectBox>
          <SelectBox icon={<CalendarDays className="size-5" />} value={when} onChange={(v) => update({ when: v })} label="زمان">
            {WHEN.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </SelectBox>
          <button type="submit" className="h-14 rounded-xl bg-brand-600 px-12 text-[16px] font-bold text-white hover:bg-brand-700 sm:col-span-2 lg:col-span-1">
            جستجو
          </button>
        </form>

        <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto pb-1 lg:flex-wrap">
          <CategoryTab active={!category} onClick={() => update({ category: "" })} label="همه رویدادها" icon={<LayoutGrid className="size-5" />} color="#1463e6" />
          {shown.map((c) => (
            <CategoryTab key={c.id} active={category === c.slug} onClick={() => update({ category: c.slug })} label={c.name} icon={<SvgIcon src={c.icon_url} className="size-5" />} color={c.color ?? "#2f80f5"} />
          ))}
          {categories.length > VISIBLE_CATEGORIES && (
            <CategoryTab active={false} onClick={() => setAllCategories((v) => !v)} label={allCategories ? "بستن" : "سایر رویدادها"} icon={<MoreHorizontal className="size-5" />} color="#64748b" />
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="relative pb-2 text-[22px] font-black text-ink after:absolute after:bottom-0 after:right-0 after:h-1 after:w-10 after:rounded-full after:bg-brand-600 sm:text-[26px]">
            لیست رویدادها
          </h2>
          <div className="flex items-center gap-2">
            <span className="hidden text-[13px] text-muted sm:inline">
              نمایش {faNumber(from)} - {faNumber(to)} از {faNumber(total)} رویداد
            </span>
            <label className="relative">
              <span className="sr-only">مرتب‌سازی</span>
              <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink/70" />
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="h-11 appearance-none rounded-xl border border-line bg-surface pr-9 pl-9 text-[13.5px] font-semibold text-ink outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </label>
            <div className="flex rounded-xl border border-line bg-surface p-1">
              {(["grid", "list"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLayout(l)}
                  aria-pressed={layout === l}
                  aria-label={l === "grid" ? "نمایش شبکه‌ای" : "نمایش فهرستی"}
                  className={cn("flex size-9 items-center justify-center rounded-lg", layout === l ? "bg-brand-500/10 text-brand-600" : "text-muted hover:text-ink")}
                >
                  {l === "grid" ? <LayoutGrid className="size-5" /> : <List className="size-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {events.isError ? (
            <ErrorState message="دریافت رویدادها با خطا مواجه شد." onRetry={() => events.refetch()} />
          ) : !events.isLoading && !events.data?.items.length ? (
            <EmptyState message="رویدادی با این شرایط پیدا نشد." />
          ) : (
            <div className={cn(layout === "grid" ? "grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3", events.isFetching && "opacity-70")}>
              {events.isLoading
                ? Array.from({ length: 8 }, (_, i) => <EventCardSkeleton key={i} />)
                : events.data!.items.map((event) => <EventCard key={event.id} event={event} variant={layout === "grid" ? "list" : "row"} />)}
            </div>
          )}
        </div>

        {pages > 1 && (
          <nav aria-label="صفحه‌بندی" className="mt-6 flex items-center justify-center gap-1.5">
            <PageButton disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} label="صفحه قبل">
              <ChevronRight className="size-4" />
            </PageButton>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2)
              .map((n, i, all) => (
                <span key={n} className="flex items-center gap-1.5">
                  {i > 0 && n - all[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
                  <PageButton active={n === page} onClick={() => update({ page: String(n) })} label={`صفحه ${n}`}>
                    {faNumber(n)}
                  </PageButton>
                </span>
              ))}
            <PageButton disabled={page >= pages} onClick={() => update({ page: String(page + 1) })} label="صفحه بعد">
              <ChevronLeft className="size-4" />
            </PageButton>
          </nav>
        )}
      </div>
    </>
  );
}

function SelectBox({ icon, value, onChange, label, children }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; label: string; children: React.ReactNode }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/70">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full appearance-none rounded-xl border border-line bg-surface pr-12 pl-10 text-[14.5px] font-bold text-ink outline-none focus:border-brand-500/50"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </label>
  );
}

function CategoryTab({ active, onClick, label, icon, color }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-14 shrink-0 items-center gap-2.5 rounded-2xl border bg-surface px-3 pl-4 text-[14px] font-bold text-ink transition",
        active ? "border-brand-600 ring-2 ring-brand-500/20" : "border-line hover:border-brand-500/40",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-xl" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 13%, var(--surface))` }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function PageButton({ children, onClick, disabled, active, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex size-10 items-center justify-center rounded-xl border text-[14px] font-bold transition disabled:opacity-40",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink hover:border-brand-500/40",
      )}
    >
      {children}
    </button>
  );
}
