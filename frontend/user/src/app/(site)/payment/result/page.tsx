import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { PaymentResultView } from "@/features/payment/PaymentResultView";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "نتیجه پرداخت", robots: { index: false } };

const fallback = (
  <div className="container-page pt-5">
    <Skeleton className="h-[560px] rounded-[18px]" />
  </div>
);

/** Landing page of the payment gateway's return; the result is read from the backend's verification. */
export default function PaymentResultPage() {
  return (
    <Suspense fallback={fallback}>
      <RequireAuth fallback={fallback}>
        <PaymentResultView />
      </RequireAuth>
    </Suspense>
  );
}
