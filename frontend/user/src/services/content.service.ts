import { http } from "./api";
import type { Banner, Category, City, ContentPage, Feature, HomeSection, Navigation, PageBlocks, SiteSettings } from "@/types/content";

/** Site-wide content managed in the admin panel. */
export const contentService = {
  siteSettings: () => http.get<SiteSettings>("/public/site-settings"),
  navigation: () => http.get<Navigation>("/public/navigation"),
  pageBlocks: () => http.get<PageBlocks>("/public/page-blocks"),
  features: () => http.get<Feature[]>("/public/features"),
  homeSections: () => http.get<HomeSection[]>("/public/home-sections"),
  banners: () => http.get<Banner[]>("/public/banners"),
  categories: () => http.get<Category[]>("/public/categories"),
  cities: () => http.get<City[]>("/public/cities"),
  page: (slug: string) => http.get<ContentPage>(`/public/pages/${encodeURIComponent(slug)}`),
  subscribe: (email: string) => http.post<void>("/public/newsletter", { email }),
};
