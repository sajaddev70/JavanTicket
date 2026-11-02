import type { Metadata } from "next";
import { SessionsView } from "@/features/events/detail/SessionsView";

export const metadata: Metadata = { title: "انتخاب سانس", robots: { index: false } };

/** Choosing a session of the event, between the event page and its seats. */
export default async function SessionsPage({ params }: { params: Promise<{ slug: string }> }) {
  return <SessionsView slug={decodeURIComponent((await params).slug)} />;
}
