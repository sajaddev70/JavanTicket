"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, MapPin, Ticket } from "lucide-react";
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
    <AccountShell title="بلیت‌های من" description="بلیت‌های الکترونیک شما؛ برای ورود، کد QR هر بلیت را نشان دهید.">
      <div className="card p-3 sm:p-4">
        <Tabs idBase="tickets" value={scope} onChange={(tab) => go({ tab })} items={SCOPES.map((s) => ({ value: s.value, label: s.label, badge: counts?.[s.value] }))} />
        <TabPanel idBase="tickets" value={scope} className="pt-4">
          {tickets.isError ? (
            <ErrorState message={errorMessage(tickets.error)} onRetry={() => tickets.refetch()} />
          ) : tickets.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[124px] rounded-2xl" />
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
              {tickets.data.items.map((t) => {
                const state = ticketState(t.status);
                return (
                  <li key={t.id}>
                    <Link href={`/tickets/${t.id}`} className="group flex gap-3 rounded-2xl border border-line bg-surface p-2.5 transition hover:border-brand-500/40 hover:shadow-card">
                      <div className="relative w-[96px] shrink-0 overflow-hidden rounded-xl bg-field sm:w-[110px]">
                        <SmartImage src={mediaUrl(t.banner_url)} fallback={null} alt="" fill sizes="110px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-[15px] font-black leading-6 text-ink group-hover:text-brand-600">{t.event_title}</p>
                          <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-[12px] font-bold", state.tone)}>{state.label}</span>
                        </div>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-2">
                          <CalendarDays className="size-4 shrink-0" />
                          {faFullDate(t.start_time)} - {faTime(t.start_time)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-2">
                          <MapPin className="size-4 shrink-0" />
                          <span className="truncate">{[t.hall_name, t.city_name].join("، ")}</span>
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="truncate text-[12.5px] font-bold text-brand-600">{t.seat_label}</span>
                          <ChevronLeft className="size-5 shrink-0 text-muted" />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {tickets.data && <Pagination className="mt-4" page={page} pages={Math.ceil(tickets.data.total / tickets.data.size)} onChange={(p) => go({ page: p })} />}
        </TabPanel>
      </div>
    </AccountShell>
  );
}
