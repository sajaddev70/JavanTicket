import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { OrderDetailView } from "@/features/orders/OrderDetailView";
import { AccountSkeleton } from "@/features/account/AccountSkeleton";

export const metadata: Metadata = { title: "جزئیات سفارش", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const number = decodeURIComponent((await params).number);
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <RequireAuth fallback={<AccountSkeleton />}>
        <OrderDetailView number={number} />
      </RequireAuth>
    </Suspense>
  );
}
