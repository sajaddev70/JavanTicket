import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { FavoritesView } from "@/features/profile/FavoritesView";
import { AccountSkeleton } from "@/features/account/AccountSkeleton";

export const metadata: Metadata = { title: "علاقه‌مندی‌ها", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <RequireAuth fallback={<AccountSkeleton />}>
        <FavoritesView />
      </RequireAuth>
    </Suspense>
  );
}
