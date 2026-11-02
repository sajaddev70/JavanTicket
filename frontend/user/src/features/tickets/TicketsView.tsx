"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTickets } from "./queries";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { AccountShell } from "@/features/account/AccountShell";
import { EventSummaryCard } from "@/components/shared/EventCard";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage } from "@/services/api";
import { faFullDate, faTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { TicketScope } from "@/types/order";

const SCOPES: { value: TicketScope; label: string; empty: string }[] = [
  { value: "upcoming", label: "آینده", empty: "هنوز بلیتی ندارید" },
  { value: "past", label: "گذشته", empty: "بلیتی از رویدادهای گذشته ندارید." },
  { value: "cancelled", label: "لغوشده", empty: "بلیت لغوشده‌ای ندارید." },
];

/** 13 بلیت‌های من: عادی، بدون بلیت، بلیت استفاده‌شده. */
export function TicketsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const scope = (SCOPES.find((s) => s.value === params.get("tab"))?.value ?? "upcoming") as TicketScope;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const tickets = useTickets(scope, page);
  const counts = tickets.data?.counts;
  const [usedId, setUsedId] = useState<number | null>(null);
  const go = (next: { tab?: TicketScope; page?: number }) => {
    const p = new URLSearchParams();
    const tab = next.tab ?? scope;
    if (tab !== "upcoming") p.set("tab", tab);
    if (next.page && next.page > 1) p.set("page", String(next.page));
    router.push(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  return (
    <AccountShell title="بلیت‌های من" noBack>
      <Tabs idBase="tickets" value={scope} onChange={(tab) => go({ tab })} items={SCOPES.map((s) => ({ value: s.value, label: s.label, badge: counts?.[s.value] }))} />
      <TabPanel idBase="tickets" value={scope} className="pt-3">
        {tickets.isError ? (
          <ErrorState message={errorMessage(tickets.error)} onRetry={() => tickets.refetch()} />
        ) : tickets.isLoading ? (
          <div className="grid gap-[11px] md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[113px] rounded-[17px]" />
            ))}
          </div>
        ) : !tickets.data?.items.length ? (
          <EmptyState
            symbol={SYMBOL.ticket}
            message={SCOPES.find((s) => s.value === scope)!.empty}
            description={scope === "upcoming" ? "از بخش رویدادها اولین بلیت خود را تهیه کنید." : undefined}
            action={scope === "upcoming" ? <ButtonLink href="/events" size="xl">مشاهده رویدادها</ButtonLink> : undefined}
          />
        ) : (
          <ul className={cn("grid gap-[11px] md:grid-cols-2", tickets.isPlaceholderData && "opacity-60")}>
            {tickets.data.items.map((t, i) => {
              const when = `${faFullDate(t.start_time)} · ساعت ${faTime(t.start_time)}`;
              const used = t.status === "USED";
              return (
                <li key={t.id} className="space-y-2">
                  <div className="relative">
                    <EventSummaryCard banner={t.banner_url} title={t.event_title} date={when} place={[t.city_name, t.hall_name].filter(Boolean).join("، ")} href={used ? undefined : `/tickets/${t.id}`} priority={i === 0}>
                      <span className="flex items-center gap-2">
                        {t.seat_label && <span className="truncate text-[11px] font-bold text-brand-600">{t.seat_label}</span>}
                        <TicketStatusBadge status={t.status} />
                      </span>
                    </EventSummaryCard>
                    {used && <button type="button" aria-label={`مشاهده بلیت ${t.event_title}`} onClick={() => setUsedId(t.id)} className="absolute inset-0 rounded-[17px]" />}
                  </div>
                  {t.status === "VALID" && (
                    <section className="card p-3.5">
                      <b className="block text-[13px] text-ink">بلیت الکترونیکی</b>
                      <p className="text-[12px] leading-[2] text-muted">{when}</p>
                      <ButtonLink href={`/tickets/${t.id}`} size="lg" block className="mt-1.5">
                        نمایش QR بلیت
                      </ButtonLink>
                    </section>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {tickets.data && <Pagination className="mt-4" page={page} pages={Math.ceil(tickets.data.total / tickets.data.size)} onChange={(p) => go({ page: p })} />}
      </TabPanel>
      {usedId !== null && (
        <StateDialog
          symbol={SYMBOL.check}
          title="این بلیت استفاده شده است"
          message="این بلیت قبلاً در ورودی ثبت شده است."
          onAction={() => router.push(`/tickets/${usedId}`)}
          onDismiss={() => setUsedId(null)}
        />
      )}
    </AccountShell>
  );
}
