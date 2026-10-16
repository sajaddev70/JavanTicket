import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { eventService } from "@/services/event.service";
import { queryKeys } from "@/constants/queryKeys";
import { isStatus } from "@/services/api";
import type { EventFilters, EventListQuery } from "@/types/event";

/** Query options shared by server prefetching (page.tsx) and the client hooks. */
export const eventQueries = {
  list: (query: EventListQuery) => queryOptions({ queryKey: queryKeys.eventList(query), queryFn: () => eventService.list(query) }),
  search: (filters: EventFilters) =>
    queryOptions({ queryKey: queryKeys.events(filters), queryFn: () => eventService.search(filters), placeholderData: keepPreviousData }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.event(slug),
      queryFn: () => eventService.detail(slug),
      // Session availability changes as tickets sell.
      staleTime: 30_000,
      retry: (n, err) => !isStatus(err, 404) && n < 1,
    }),
};
