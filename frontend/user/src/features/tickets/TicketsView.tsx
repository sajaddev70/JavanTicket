"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Ticket } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { useTickets } from "./queries";
import { ticketState } from "./TicketStatusBadge";
import { AccountShell } from "@/features/account/AccountShell";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { errorMessage } from "@/services/api";
import { faFullDate, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { TicketScope } from "@/types/order";

const SCOPES: { value: TicketScope; label: string; empty: string }[] = [
  { value: "upcoming", label: "آینده", empty: "هنوز بلیتی برای رویدادهای پیش رو خریداری نکرده‌اید." },
  { value: "past", label: "گذشته", empty: "بلیتی از رویدادهای گذشته ندارید." },
  { value: "cancelled", label: "لغو شده", empty: "بلیت لغو شده‌ای ندارید." },
];

export function TicketsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const scope = (SCOPES.find((s) => s.value === params.get("tab"))?.value ?? "upcoming") as TicketScope;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const tickets = useTickets(scope, page);
  const counts = tickets.data?.counts;
  const go = (next: { tab?: TicketScope; page?: number }) => {
    const p = new URLSearchParams();
    const tab = next.tab ?? scope;
    if (tab !== "upcoming") p.set("tab", tab);
    if (next.page && next.page > 1) p.set("page", String(next.page));
    router.push(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  return (
    <AccountShell title="بلیت‌های من">
      <Tabs variant="band" idBase="tickets" value={scope} onChange={(tab) => go({ tab })} items={SCOPES.map((s) => ({ value: s.value, label: s.label, badge: counts?.[s.value] }))} />
      <TabPanel idBase="tickets" value={scope} className="pt-1">
        {tickets.isError ? (
          <ErrorState message={errorMessage(tickets.error)} onRetry={() => tickets.refetch()} />
        ) : tickets.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[190px] rounded-[22px]" />
            ))}
          </div>
        ) : !tickets.data?.items.length ? (
          <EmptyState
            icon={Ticket}
            message={SCOPES.find((s) => s.value === scope)!.empty}
            action={scope === "upcoming" ? <ButtonLink href="/events">مشاهده رویدادها</ButtonLink> : undefined}
          />
        ) : (
          <ul className={cn("grid gap-3 md:grid-cols-2", tickets.isPlaceholderData && "opacity-60")}>
            {tickets.data.items.map((t, i) => {
              const state = ticketState(t.status);
              return (
                <li key={t.id} className="min-w-0">
                  {/* Reference 08: poster on the start side, title, date, place and the violet "مشاهده بلیت" button */}
                  <article className="group relative flex gap-3.5 rounded-[22px] border border-line bg-surface p-3 shadow-card transition hover:shadow-float">
                    <div className="relative aspect-[3/4] w-[96px] shrink-0 self-start overflow-hidden rounded-[16px] bg-field sm:w-[110px]">
                      <SmartImage src={mediaUrl(t.banner_url)} fallback={null} alt="" fill preload={i === 0} sizes="110px" className="object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-2 text-[15.5px] font-black leading-7 text-ink">{t.event_title}</h2>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", state.tone)}>{state.label}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
                        <Icon name="common/calendar-simple" className="size-4 shrink-0 text-ink-2" />
                        {faFullDate(t.start_time)} - {faTime(t.start_time)}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
                        <Icon name="common/location" className="size-4 shrink-0 text-ink-2" />
                        <span className="truncate">{[t.city_name, t.hall_name].filter(Boolean).join("، ")}</span>
                      </p>
                      {t.seat_label && <p className="mt-1 truncate text-[12.5px] font-bold text-ink-2">{t.seat_label}</p>}
                      <Link
                        href={`/tickets/${t.id}`}
                        className="bg-grad-primary glow-primary mt-3 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full px-5 text-[14px] font-black text-white transition after:absolute after:inset-0 hover:brightness-110"
                      >
                        مشاهده بلیت
                        <ArrowLeft className="size-[18px]" />
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
        {tickets.data && <Pagination className="mt-4" page={page} pages={Math.ceil(tickets.data.total / tickets.data.size)} onChange={(p) => go({ page: p })} />}
      </TabPanel>
    </AccountShell>
  );
}
