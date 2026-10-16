import { http } from "./api";
import type { EventDetail, EventFilters, EventListQuery, Paged, PublicEvent } from "@/types/event";

export const eventService = {
  /** Event rows of the homepage (section / category), narrowed to a city. */
  list: ({ section, category, q, cityId, limit }: EventListQuery) =>
    http.get<PublicEvent[]>("/public/events", { section, category, q, cityId, limit }),

  /** Events page: server-side filters and paging. */
  search: (filters: EventFilters) =>
    http.get<Paged<PublicEvent>>("/public/events/search", {
      q: filters.q,
      cityId: filters.cityId,
      category: filters.category,
      when: filters.when,
      section: filters.section,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      page: filters.page,
      size: filters.size,
    }),

  /** Event with its sessions, speakers, gallery and FAQ. */
  detail: (slug: string) => http.get<EventDetail>(`/public/events/${encodeURIComponent(slug)}`),
};
