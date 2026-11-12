import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { NotFoundContent } from "@/components/feedback/NotFoundContent";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
};

/**
 * 404 for URLs that match no route. Only the root layout is around it here, so it brings its own header and footer;
 * notFound() thrown inside the site pages is handled by (site)/not-found.tsx, which leaves them to the site layout.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <AppHeader />
      <main id="main" className="flex flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
