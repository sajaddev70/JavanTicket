import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "پنل مدیریت | سامانه رویدادهای جوانان",
  description: "سامانه جامع مدیریت رویدادها، سانس‌ها و فروش بلیت",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
