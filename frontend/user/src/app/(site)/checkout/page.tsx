import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { CheckoutSkeleton, CheckoutView } from "@/features/checkout/CheckoutView";

export const metadata: Metadata = { title: "تکمیل اطلاعات خرید", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <RequireAuth fallback={<CheckoutSkeleton />}>
        <CheckoutView />
      </RequireAuth>
    </Suspense>
  );
}
