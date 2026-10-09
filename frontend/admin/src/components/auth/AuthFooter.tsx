'use client';

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { faYear } from "@/lib/format";
import { useIsClient } from "@/hooks/useIsClient";

export function AuthFooter() {
  const { data } = useSiteSettings();
  const year = useIsClient() ? faYear(new Date()) : null;

  return (
    <p className="relative z-10 py-6 text-center text-[13px] text-muted">
      تمامی حقوق محفوظ است. © {year} {data?.site_name}
    </p>
  );
}
