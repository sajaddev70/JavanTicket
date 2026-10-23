import { cookies } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { contentQueries } from "@/hooks/useContent";
import { eventQueries } from "@/features/events/queries";
import { CITY_COOKIE, parseCityId } from "@/lib/city";
import { HeroSlider } from "@/features/home/HeroSlider";
import { CategoryStrip } from "@/features/home/CategoryStrip";
import { HomeEventSections } from "@/features/home/HomeEventSections";
import { WhyJavan } from "@/features/home/WhyJavan";

/** Homepage, rendered on the server with the visitor's city so search engines and first paint get real content. */
export default async function HomePage() {
  const cityId = parseCityId((await cookies()).get(CITY_COOKIE)?.value);
  const queryClient = makeQueryClient();
  const [sections] = await Promise.all([
    queryClient.fetchQuery(contentQueries.homeSections()).catch(() => []),
    queryClient.prefetchQuery(contentQueries.pageBlocks()),
    queryClient.prefetchQuery(contentQueries.banners()),
    queryClient.prefetchQuery(contentQueries.categories()),
    queryClient.prefetchQuery(contentQueries.features()),
  ]);
  await Promise.all(
    sections.map((s) => queryClient.prefetchQuery(eventQueries.list({ section: s.section, category: s.category_slug, limit: s.item_limit, cityId }))),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container-page space-y-4 pt-1 lg:space-y-5 lg:pt-5">
        <HeroSlider />
        <CategoryStrip />
        <HomeEventSections />
        <WhyJavan />
      </div>
      <div className="h-5 lg:h-8" />
    </HydrationBoundary>
  );
}
