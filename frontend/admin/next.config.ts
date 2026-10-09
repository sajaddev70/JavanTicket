import type { NextConfig } from "next";

// The admin panel is served under /admin (e.g. /admin/login, /admin/dashboard).
const basePath = "/admin";

const nextConfig: NextConfig = {
  // Self-contained server (server.js) for the Docker image.
  output: "standalone",
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async headers() {
    // The service worker must always be revalidated so new versions roll out immediately.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
  async redirects() {
    return [
      // Opening the bare host (e.g. http://localhost:3000) lands on the panel's entry point.
      { source: "/", destination: basePath, basePath: false, permanent: false },
      // Any other path outside /admin is forwarded into the panel, where unknown routes get the designed 404.
      { source: "/:path((?!admin(?:/|$)|_next/).+)", destination: `${basePath}/:path`, basePath: false, permanent: false },
    ];
  },
};

export default nextConfig;
