import { queryOptions, useQuery } from "@tanstack/react-query";
import { contentService } from "@/services/content.service";
import { queryKeys } from "@/constants/queryKeys";
import { isStatus } from "@/services/api";

const LONG = 10 * 60_000;

/** Query options shared by server prefetching (page.tsx) and the client hooks below. */
export const contentQueries = {
  siteSettings: () => queryOptions({ queryKey: queryKeys.siteSettings, queryFn: contentService.siteSettings, staleTime: LONG }),
  navigation: () => queryOptions({ queryKey: queryKeys.navigation, queryFn: contentService.navigation, staleTime: LONG }),
  pageBlocks: () => queryOptions({ queryKey: queryKeys.pageBlocks, queryFn: contentService.pageBlocks, staleTime: LONG }),
  features: () => queryOptions({ queryKey: queryKeys.features, queryFn: contentService.features, staleTime: LONG }),
  homeSections: () => queryOptions({ queryKey: queryKeys.homeSections, queryFn: contentService.homeSections, staleTime: LONG }),
  banners: () => queryOptions({ queryKey: queryKeys.banners, queryFn: contentService.banners, staleTime: LONG }),
  categories: () => queryOptions({ queryKey: queryKeys.categories, queryFn: contentService.categories, staleTime: LONG }),
  cities: () => queryOptions({ queryKey: queryKeys.cities, queryFn: contentService.cities, staleTime: LONG }),
  page: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.page(slug),
      queryFn: () => contentService.page(slug),
      staleTime: LONG,
      retry: (n, err) => !isStatus(err, 404) && n < 1,
    }),
};

export const useSiteSettings = () => useQuery(contentQueries.siteSettings());
export const useNavigation = () => useQuery(contentQueries.navigation());
export const usePageBlocks = () => useQuery(contentQueries.pageBlocks());
export const useFeatures = () => useQuery(contentQueries.features());
export const useHomeSections = () => useQuery(contentQueries.homeSections());
export const useBanners = () => useQuery(contentQueries.banners());
export const useCategories = () => useQuery(contentQueries.categories());
export const useCities = () => useQuery(contentQueries.cities());
export const useContentPage = (slug: string) => useQuery(contentQueries.page(slug));

/** One content block (hero / notice) by key. */
export function usePageBlock(key: string) {
  const query = usePageBlocks();
  return { ...query, block: query.data?.[key] };
}
