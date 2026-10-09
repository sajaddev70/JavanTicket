import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // The service worker must always be revalidated so new versions roll out immediately.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

export default nextConfig;
