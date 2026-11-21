import localFont from "next/font/local";

/**
 * Vazirmatn, "FD" (Farsi Digits) build: digits 0–9 are drawn with Persian glyphs, so every number on screen —
 * API data, typed input, prices — renders in Persian regardless of the underlying characters. SIL OFL 1.1 (Vazirmatn-OFL.txt).
 */
export const vazirmatn = localFont({
  src: [
    { path: "./Vazirmatn-FD-Regular.woff2", weight: "400", style: "normal" },
    { path: "./Vazirmatn-FD-Medium.woff2", weight: "500", style: "normal" },
    { path: "./Vazirmatn-FD-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./Vazirmatn-FD-Bold.woff2", weight: "700", style: "normal" },
    { path: "./Vazirmatn-FD-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./Vazirmatn-FD-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});
