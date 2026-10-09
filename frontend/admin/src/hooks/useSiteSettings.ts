import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/services/api";

export interface SiteSettings {
  site_name?: string | null;
  short_name?: string | null;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: () => apiGet<SiteSettings>("/public/site-settings"),
    staleTime: 10 * 60_000,
  });
}
