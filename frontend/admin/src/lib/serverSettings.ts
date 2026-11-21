export interface PublicSiteSettings {
  site_name?: string | null;
  short_name?: string | null;
  meta_description?: string | null;
}

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/** Site settings for metadata and the web manifest (rendered on the server); null when the API is unreachable. */
export async function getSiteSettings(): Promise<PublicSiteSettings | null> {
  try {
    const res = await fetch(`${API_URL}/public/site-settings`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: PublicSiteSettings }).data ?? null;
  } catch {
    return null;
  }
}
