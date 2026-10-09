import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppProviders from "@/providers/AppProviders";
import { iranSans } from "@/fonts/iranSans";
import { themeInitScript } from "@/lib/theme";
import { getSiteSettings } from "@/lib/serverSettings";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { BASE_PATH } from "@/lib/assets";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings?.site_name;
  return {
    title: siteName ? `پنل مدیریت | ${siteName}` : "پنل مدیریت",
    description: settings?.meta_description ?? undefined,
    applicationName: settings?.short_name ?? siteName ?? undefined,
    appleWebApp: { capable: true, title: settings?.short_name ?? "پنل مدیریت", statusBarStyle: "default" },
    icons: { apple: `${BASE_PATH}/icons/apple-touch-icon.png` },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f4fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1424" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={iranSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
