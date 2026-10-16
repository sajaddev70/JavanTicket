import type { EventFilters, EventListQuery } from "@/types/event";
import type { OrderStatus, TicketScope } from "@/types/order";

/**
 * Every server-state key in one place. Keys built here are used both when the server prefetches a page and by
 * the client hooks, so they must stay identical (filters are normalized: no undefined / empty values).
 */
export const queryKeys = {
  siteSettings: ["site-settings"] as const,
  navigation: ["navigation"] as const,
  pageBlocks: ["page-blocks"] as const,
  features: ["features"] as const,
  homeSections: ["home-sections"] as const,
  banners: ["banners"] as const,
  categories: ["categories"] as const,
  cities: ["cities"] as const,
  page: (slug: string) => ["page", slug] as const,

  eventList: (query: EventListQuery) => ["events", "list", normalize(query)] as const,
  events: (filters: EventFilters) => ["events", normalize(filters)] as const,
  event: (slug: string) => ["event", slug] as const,
  seatMap: (sessionId: number) => ["seat-map", sessionId] as const,

  orders: (params: { status?: OrderStatus | ""; page?: number }) => ["orders", normalize(params)] as const,
  order: (number: string) => ["order", number] as const,
  paymentMethods: ["payment-methods"] as const,
  payment: (id: number) => ["payment", id] as const,
  tickets: (params: { scope: TicketScope; page?: number }) => ["tickets", normalize(params)] as const,
  ticket: (id: number) => ["ticket", id] as const,
  profile: ["profile"] as const,
  favorites: ["favorites"] as const,
  favoriteIds: ["favorites", "ids"] as const,
};

function normalize<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== "")) as Partial<T>;
}
