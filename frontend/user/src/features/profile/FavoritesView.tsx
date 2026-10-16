"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "./queries";
import { AccountShell } from "@/features/account/AccountShell";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { errorMessage } from "@/services/api";

export function FavoritesView() {
  const favorites = useFavorites();
  return (
    <AccountShell title="علاقه‌مندی‌ها" description="رویدادهایی که نشان کرده‌اید.">
      {favorites.isError ? (
        <ErrorState message={errorMessage(favorites.error)} onRetry={() => favorites.refetch()} />
      ) : favorites.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : !favorites.data?.length ? (
        <EmptyState icon={Heart} message="هنوز رویدادی را به علاقه‌مندی‌ها اضافه نکرده‌اید." description="با زدن نماد قلب روی هر رویداد، آن را اینجا ذخیره کنید." action={<ButtonLink href="/events">مشاهده رویدادها</ButtonLink>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.data.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
