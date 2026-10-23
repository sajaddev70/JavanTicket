import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/serverSettings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  return {
    id: "/",
    name: settings?.site_name ?? "خرید بلیت",
    short_name: settings?.short_name ?? settings?.site_name ?? "خرید بلیت",
    description: settings?.meta_description ?? undefined,
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F7F9FC",
    theme_color: "#FFFFFF",
    categories: ["entertainment", "events"],
    icons: [
      { src: "/assets/pwa/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/pwa/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
