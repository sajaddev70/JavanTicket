import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TicketsView } from "@/features/tickets/TicketsView";
import { AccountSkeleton } from "@/features/account/AccountSkeleton";

export const metadata: Metadata = { title: "بلیت‌های من", robots: { index: false } };

export default function TicketsPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <RequireAuth fallback={<AccountSkeleton />}>
        <TicketsView />
      </RequireAuth>
    </Suspense>
  );
}
