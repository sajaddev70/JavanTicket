"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

/** Path to sign in and come back to [next]. */
export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}

/**
 * Client-side guard of the account and checkout pages. The backend still authorizes every request; this only
 * sends signed-out visitors to /login (and back here afterwards) instead of showing empty screens.
 */
export function RequireAuth({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const hydrated = useAuthStore((s) => s.hydrated);
  const authenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (hydrated && !authenticated) {
      const query = search.toString();
      router.replace(loginHref(query ? `${pathname}?${query}` : pathname));
    }
  }, [hydrated, authenticated, pathname, search, router]);

  return hydrated && authenticated ? children : fallback;
}
