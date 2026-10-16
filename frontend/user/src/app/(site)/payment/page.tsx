import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { CheckoutSkeleton } from "@/features/checkout/CheckoutView";
import { PaymentView } from "@/features/payment/PaymentView";

export const metadata: Metadata = { title: "پرداخت", robots: { index: false } };

export default function PaymentPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <RequireAuth fallback={<CheckoutSkeleton />}>
        <PaymentView />
      </RequireAuth>
    </Suspense>
  );
}
