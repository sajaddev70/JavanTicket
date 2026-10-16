import { useQuery } from "@tanstack/react-query";
import { useCity } from "@/providers/CityProvider";
import { eventQueries } from "./queries";
import type { EventFilters, EventListQuery } from "@/types/event";

/** Homepage rows, narrowed to the city picked in the header. */
export function useEventList(query: Omit<EventListQuery, "cityId">) {
  const { cityId } = useCity();
  return useQuery(eventQueries.list({ ...query, cityId }));
}

export const useEventSearch = (filters: EventFilters) => useQuery(eventQueries.search(filters));
export const useEventDetail = (slug: string) => useQuery(eventQueries.detail(slug));
