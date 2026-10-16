import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { contentQueries } from "@/hooks/useContent";
import { makeQueryClient } from "@/lib/queryClient";

/** Shared layout of every public page: header (navigation, search, city), content, footer. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(contentQueries.siteSettings()),
    queryClient.prefetchQuery(contentQueries.navigation()),
    queryClient.prefetchQuery(contentQueries.cities()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-3 focus:top-3 focus:z-[80] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-3 focus:text-white">
        پرش به محتوای اصلی
      </a>
      <div className="flex min-h-screen flex-col bg-page">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <MobileTabBar />
      </div>
    </HydrationBoundary>
  );
}
