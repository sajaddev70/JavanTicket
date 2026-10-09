import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/serverSettings";
import { BASE_PATH } from "@/lib/assets";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const siteName = settings?.site_name;
  return {
    id: `${BASE_PATH}/`,
    name: siteName ? `پنل مدیریت ${siteName}` : "پنل مدیریت",
    short_name: settings?.short_name ? `مدیریت ${settings.short_name}` : "پنل مدیریت",
    description: settings?.meta_description ?? undefined,
    lang: "fa",
    dir: "rtl",
    start_url: `${BASE_PATH}/dashboard`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#f1f4fb",
    theme_color: "#0b2442",
    icons: [
      { src: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
