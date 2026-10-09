import type { Metadata } from "next";
import { OfflineView } from "@/components/pwa/OfflineView";

export const metadata: Metadata = { title: "اتصال برقرار نیست" };

export default function OfflinePage() {
  return <OfflineView />;
}
