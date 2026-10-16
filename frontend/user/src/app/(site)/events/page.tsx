import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { contentQueries } from "@/hooks/useContent";
import { eventQueries } from "@/features/events/queries";
import { apiFilters, readFilters } from "@/features/events/filters";
import { EventsBrowser } from "@/features/events/EventsBrowser";
import { CITY_COOKIE, parseCityId } from "@/lib/city";
import { getPageBlock } from "@/lib/serverSettings";

export async function generateMetadata(): Promise<Metadata> {
  const hero = await getPageBlock("EVENTS_HERO");
  return {
    title: "رویدادها",
    description: hero?.subtitle ?? undefined,
    alternates: { canonical: "/events" },
    openGraph: { title: "رویدادها", description: hero?.subtitle ?? undefined },
  };
}

/** Events listing: the first page for the URL's filters is rendered on the server; filtering continues client-side. */
export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const cityId = parseCityId((await cookies()).get(CITY_COOKIE)?.value);
  const filters = readFilters((k) => {
    const v = query[k];
    return Array.isArray(v) ? v[0] : v;
  }, cityId);

  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(eventQueries.search(apiFilters(filters))),
    queryClient.prefetchQuery(contentQueries.categories()),
    queryClient.prefetchQuery(contentQueries.pageBlocks()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <EventsBrowser />
      </Suspense>
    </HydrationBoundary>
  );
}
