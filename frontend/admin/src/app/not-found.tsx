import type { Metadata } from "next";
import { NotFoundView } from "@/components/ui/NotFoundView";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد | پنل مدیریت",
};

export default function NotFound() {
  return <NotFoundView />;
}
