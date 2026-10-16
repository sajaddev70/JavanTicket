import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { OrdersView } from "@/features/orders/OrdersView";
import { AccountSkeleton } from "@/features/account/AccountSkeleton";

export const metadata: Metadata = { title: "سفارش‌های من", robots: { index: false } };

export default function OrdersPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <RequireAuth fallback={<AccountSkeleton />}>
        <OrdersView />
      </RequireAuth>
    </Suspense>
  );
}
