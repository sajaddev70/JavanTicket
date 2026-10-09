import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HomeHero } from "@/components/home/HomeHero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { HomeSections } from "@/components/home/HomeSections";
import { CtaBanner } from "@/components/home/CtaBanner";

export default function UserHomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-5 px-3 pt-3 sm:px-4 lg:space-y-6 lg:px-5">
        <HomeHero />
        <CategoryGrid />
        <HomeSections />
        <CtaBanner />
      </main>
      <SiteFooter />
    </div>
  );
}
