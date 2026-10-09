import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { publicApi, type EventQuery, type EventSearch } from "@/services/public";
import { useCityStore } from "@/stores/useCityStore";

const LONG = 10 * 60_000;

export const useSiteSettings = () =>
  useQuery({ queryKey: ["site-settings"], queryFn: publicApi.siteSettings, staleTime: LONG });

export const useNavigation = () => useQuery({ queryKey: ["navigation"], queryFn: publicApi.navigation, staleTime: LONG });

export const useFeatures = () => useQuery({ queryKey: ["features"], queryFn: publicApi.features, staleTime: LONG });

export const useHomeSections = () => useQuery({ queryKey: ["home-sections"], queryFn: publicApi.homeSections, staleTime: LONG });

export const useBanners = () => useQuery({ queryKey: ["banners"], queryFn: publicApi.banners, staleTime: LONG });

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: publicApi.categories, staleTime: LONG });

export const useCities = () => useQuery({ queryKey: ["cities"], queryFn: publicApi.cities, staleTime: LONG });

/** Published events, narrowed to the city picked in the header. */
export function useEvents(query: Omit<EventQuery, "cityId">) {
  const cityId = useCityStore((s) => s.cityId);
  return useQuery({
    queryKey: ["events", query, cityId],
    queryFn: () => publicApi.events({ ...query, cityId }),
  });
}

export const useEventDetail = (slug: string) =>
  useQuery({ queryKey: ["event", slug], queryFn: () => publicApi.event(slug), retry: (n, err) => (err as { status?: number }).status !== 404 && n < 1 });

export const useContentPage = (slug: string) =>
  useQuery({ queryKey: ["page", slug], queryFn: () => publicApi.page(slug), retry: (n, err) => (err as { status?: number }).status !== 404 && n < 1 });

export const usePageBlocks = () => useQuery({ queryKey: ["page-blocks"], queryFn: publicApi.pageBlocks, staleTime: LONG });

/** Events screen: filters + paging; the header city applies unless the page picks its own. */
export function useEventSearch(query: Omit<EventSearch, "cityId"> & { cityId?: number | null }) {
  const headerCity = useCityStore((s) => s.cityId);
  const cityId = query.cityId !== undefined ? query.cityId : headerCity;
  return useQuery({
    queryKey: ["events", "search", query, cityId],
    queryFn: () => publicApi.searchEvents({ ...query, cityId }),
    placeholderData: keepPreviousData,
  });
}

export const useSeatMap = (sessionId: number) =>
  useQuery({ queryKey: ["seat-map", sessionId], queryFn: () => publicApi.seatMap(sessionId), refetchInterval: 30_000 });
