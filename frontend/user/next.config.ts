import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server (server.js) for the Docker image.
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      // The service worker must always be revalidated so new versions roll out immediately.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  async rewrites() {
    // Browsers ask for /favicon.ico regardless of the declared icons.
    return [{ source: "/favicon.ico", destination: "/icons/icon-192.png" }];
  },
  async redirects() {
    // Seat selection used to live under the event; old links keep working.
    return [{ source: "/events/:slug/sessions/:id", destination: "/sessions/:id/seats", permanent: true }];
  },
};

export default nextConfig;
