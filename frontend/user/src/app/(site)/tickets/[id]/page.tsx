import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TicketView } from "@/features/tickets/TicketView";
import { AccountSkeleton } from "@/features/account/AccountSkeleton";

export const metadata: Metadata = { title: "بلیت الکترونیک", robots: { index: false } };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <RequireAuth fallback={<AccountSkeleton />}>
        <TicketView id={id} />
      </RequireAuth>
    </Suspense>
  );
}
