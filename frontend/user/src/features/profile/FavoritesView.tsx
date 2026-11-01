"use client";

import { useFavorites } from "./queries";
import { AccountShell } from "@/features/account/AccountShell";
import { EventCard, EventCardSkeleton } from "@/components/shared/EventCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage } from "@/services/api";

/** 18 علاقه‌مندی‌ها: عادی، بدون علاقه‌مندی. */
export function FavoritesView() {
  const favorites = useFavorites();
  return (
    <AccountShell title="علاقه‌مندی‌ها">
      {favorites.isError ? (
        <ErrorState message={errorMessage(favorites.error)} onRetry={() => favorites.refetch()} />
      ) : favorites.isLoading ? (
        <div className="grid gap-[11px] md:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : !favorites.data?.length ? (
        <EmptyState symbol={SYMBOL.heart} message="هنوز رویدادی ذخیره نکرده‌اید" description="رویدادهای موردعلاقه را با قلب نشان‌دار کنید." action={<ButtonLink href="/events" size="xl">مشاهده رویدادها</ButtonLink>} />
      ) : (
        <>
          <h2 className="mb-[9px] text-[15px] font-black text-ink">رویدادهای ذخیره‌شده</h2>
          <div className="grid gap-[11px] md:grid-cols-2">
            {favorites.data.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </>
      )}
    </AccountShell>
  );
}
