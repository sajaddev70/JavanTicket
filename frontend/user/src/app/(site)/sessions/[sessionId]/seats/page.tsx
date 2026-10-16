import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeatSelectionView } from "@/features/seats/SeatSelectionView";

export const metadata: Metadata = { title: "انتخاب صندلی", robots: { index: false } };

/** Seat selection: live seat states and locks are per visitor, so the page renders in the browser. */
export default async function SeatsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const id = Number((await params).sessionId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <SeatSelectionView sessionId={id} />;
}
