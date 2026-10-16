import type { PageBlock, SiteSettings } from "@/types/content";
import type { EventDetail } from "@/types/event";

/** Backend as seen from the Next.js server (Docker network in production). */
const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

/** GET for metadata / manifest rendering on the server; null when the API is unreachable or answers an error. */
async function serverGet<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: T }).data ?? null;
  } catch {
    return null;
  }
}

export const getSiteSettings = () => serverGet<SiteSettings>("/public/site-settings", 300);

export async function getPageBlock(key: string): Promise<PageBlock | null> {
  return (await serverGet<Record<string, PageBlock>>("/public/page-blocks", 300))?.[key] ?? null;
}

export const getEvent = (slug: string) => serverGet<EventDetail>(`/public/events/${encodeURIComponent(slug)}`, 60);

export const getContentPage = (slug: string) => serverGet<{ title: string; content?: string | null }>(`/public/pages/${encodeURIComponent(slug)}`, 300);
