import type { EventFilters, EventSort, EventWhen } from "@/types/event";

/**
 * Events page filters live in the URL (shareable, survive refresh, work with back / forward):
 * /events?q=&category=&city=&when=&type=&min=&max=&sort=&page=
 * `city` is a city id or "all"; without it the city picked in the header applies.
 */
export const PAGE_SIZE = 12;

export const WHEN_OPTIONS: { value: EventWhen | ""; label: string }[] = [
  { value: "", label: "همه تاریخ‌ها" },
  { value: "today", label: "امروز" },
  { value: "week", label: "این هفته" },
  { value: "month", label: "این ماه" },
];

export const SORT_OPTIONS: { value: EventSort; label: string }[] = [
  { value: "newest", label: "جدیدترین" },
  { value: "soonest", label: "نزدیک‌ترین زمان" },
  { value: "price", label: "ارزان‌ترین" },
];

export const TYPE_OPTIONS: { value: "" | "featured" | "popular"; label: string }[] = [
  { value: "", label: "همه انواع" },
  { value: "featured", label: "رویدادهای ویژه" },
  { value: "popular", label: "پرطرفدار" },
];

type Getter = (key: string) => string | null | undefined;

const num = (v: string | null | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? n : null;
};

export function readFilters(get: Getter, headerCityId: number | null): EventFilters & { cityParam: string } {
  const cityParam = get("city") ?? "";
  const cityId = cityParam === "all" ? null : (num(cityParam) ?? headerCityId);
  const when = get("when");
  const type = get("type");
  const sort = get("sort");
  return {
    q: get("q")?.trim() || "",
    category: get("category") || "",
    cityId,
    when: when === "today" || when === "week" || when === "month" ? when : "",
    section: type === "featured" || type === "popular" ? type : "",
    minPrice: num(get("min")),
    maxPrice: num(get("max")),
    sort: sort === "soonest" || sort === "price" ? sort : "newest",
    page: Math.max(1, Math.floor(num(get("page")) ?? 1)),
    size: PAGE_SIZE,
    cityParam,
  };
}

/** The API query of the filters (what the query key is built from). */
export function apiFilters(f: ReturnType<typeof readFilters>): EventFilters {
  const { q, category, cityId, when, section, minPrice, maxPrice, sort, page, size } = f;
  return { q, category, cityId, when, section, minPrice, maxPrice, sort, page, size };
}
