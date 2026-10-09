import localFont from "next/font/local";

/**
 * IRANSans "FaNum" build: digits 0–9 are drawn with Persian glyphs, so every number on screen —
 * API data, typed input, chart labels — renders in Persian regardless of the underlying characters.
 */
export const iranSans = localFont({
  src: [
    { path: "./IRANSansFaNum-Regular.woff2", weight: "400", style: "normal" },
    { path: "./IRANSansFaNum-Medium.woff2", weight: "500", style: "normal" },
    { path: "./IRANSansFaNum-Bold.woff2", weight: "700 900", style: "normal" },
  ],
  variable: "--font-iransans",
  display: "swap",
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});
