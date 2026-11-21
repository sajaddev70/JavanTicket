import { NextResponse, type NextRequest } from "next/server";

/**
 * Maintenance gate.
 * While `maintenance_enabled` is on in the admin settings, every page of the public address shows /maintenance.
 * The full site stays reachable for the team through /preview: it sets a preview cookie and redirects to the site
 * (/preview/events → /events). /preview/exit removes the cookie again.
 * API, /media, /uploads and build assets are never gated (see the matcher).
 */

const PREVIEW_COOKIE = "site_preview";
const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30;
const MAINTENANCE_PATH = "/maintenance";
/** Pages that must work for everyone (the service worker caches /offline on install). */
const ALWAYS_OPEN = new Set([MAINTENANCE_PATH, "/offline"]);

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const CACHE_MS = 15_000;

/** Last known flag; true until the API answers once, so a fresh server never exposes the site by accident. */
let maintenance = { enabled: true, checkedAt: 0 };

async function maintenanceEnabled(): Promise<boolean> {
  if (Date.now() - maintenance.checkedAt < CACHE_MS) return maintenance.enabled;
  try {
    const res = await fetch(`${API_URL}/public/site-settings`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const body = (await res.json()) as { data?: { maintenance_enabled?: boolean | null } };
      maintenance = { enabled: body.data?.maintenance_enabled !== false, checkedAt: Date.now() };
      return maintenance.enabled;
    }
  } catch {
    // Keep the last known value when the API is unreachable.
  }
  maintenance = { ...maintenance, checkedAt: Date.now() };
  return maintenance.enabled;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/preview" || pathname.startsWith("/preview/")) {
    const rest = pathname.slice("/preview".length) || "/";
    const target = request.nextUrl.clone();
    target.pathname = rest === "/exit" ? "/" : rest;
    const res = NextResponse.redirect(target);
    if (rest === "/exit") res.cookies.delete(PREVIEW_COOKIE);
    else res.cookies.set(PREVIEW_COOKIE, "1", { path: "/", maxAge: PREVIEW_MAX_AGE, sameSite: "lax", httpOnly: true });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (ALWAYS_OPEN.has(pathname)) {
    // Nothing to wait for once maintenance is over.
    if (pathname === MAINTENANCE_PATH && !(await maintenanceEnabled())) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (request.cookies.get(PREVIEW_COOKIE)?.value === "1") return NextResponse.next();
  if (!(await maintenanceEnabled())) return NextResponse.next();

  const target = request.nextUrl.clone();
  target.pathname = MAINTENANCE_PATH;
  target.search = "";
  const res = NextResponse.rewrite(target);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}

export const config = {
  // Pages only: skip build output, API, backend files and anything with a file extension (icons, sw.js, manifest).
  matcher: ["/((?!_next/|api/|media/|uploads/|assets/|.*\\..*).*)"],
};
