import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import AppProviders from "@/providers/AppProviders";
import { vazirmatn } from "@/fonts/vazirmatn";
import { themeInitScript } from "@/lib/theme";
import { getSiteSettings } from "@/lib/serverSettings";
import { CITY_COOKIE, parseCityId } from "@/lib/city";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings?.site_name ?? undefined;
  return {
    title: siteName ? { default: siteName, template: `%s | ${siteName}` } : "خرید بلیت",
    description: settings?.meta_description ?? undefined,
    applicationName: settings?.short_name ?? siteName,
    appleWebApp: { capable: true, title: settings?.short_name ?? siteName, statusBarStyle: "default" },
    icons: { apple: "/assets/pwa/apple-touch-icon.png" },
    openGraph: { siteName, locale: "fa_IR", type: "website" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1424" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The header city lives in a cookie so server-rendered event lists already match the visitor's choice.
  const initialCityId = parseCityId((await cookies()).get(CITY_COOKIE)?.value);
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <AppProviders initialCityId={initialCityId}>{children}</AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
