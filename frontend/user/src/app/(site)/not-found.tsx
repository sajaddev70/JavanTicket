import type { Metadata } from "next";
import { NotFoundContent } from "@/components/feedback/NotFoundContent";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
};

/** notFound() inside a site page: the site layout already renders the header and footer around this. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
