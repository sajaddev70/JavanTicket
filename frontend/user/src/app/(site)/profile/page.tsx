import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { ProfileView } from "@/features/profile/ProfileView";
import { AccountSkeleton } from "@/features/account/AccountSkeleton";

export const metadata: Metadata = { title: "حساب کاربری", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <RequireAuth fallback={<AccountSkeleton />}>
        <ProfileView />
      </RequireAuth>
    </Suspense>
  );
}
