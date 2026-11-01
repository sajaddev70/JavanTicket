"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEventDetail } from "../hooks";
import { QuantityDialog } from "./QuantityDialog";
import { EventHero } from "./EventDetailView";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { sessionAvailability } from "@/components/shared/SessionCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { loginHref } from "@/components/shared/RequireAuth";
import { toast } from "@/stores/useToastStore";
import { faFullDate, faNumber, faTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { EventDetail, EventSession } from "@/types/event";

/** 07 انتخاب سانس: عادی، سانس انتخاب‌شده، سانس تکمیل. */
export function SessionsView({ slug }: { slug: string }) {
  const { data: event, isLoading, isError, error, refetch } = useEventDetail(slug);
  const back = `/events/${encodeURIComponent(slug)}`;
  return (
    <>
      <PageTopBar title="انتخاب سانس" fallbackHref={back} />
      {isError ? (
        <ErrorState className="container-page" message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !event ? (
        <div className="container-page space-y-3 pt-1.5" aria-busy>
          <Skeleton className="h-[130px] rounded-[23px]" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[110px] rounded-[20px]" />
          ))}
        </div>
      ) : (
        <Sessions event={event} />
      )}
    </>
  );
}

function Sessions({ event }: { event: EventDetail }) {
  const router = useRouter();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const firstBookable = event.sessions.find((s) => sessionAvailability(s).bookable);
  const [selectedId, setSelectedId] = useState<number | null>(firstBookable?.id ?? null);
  const [full, setFull] = useState(false);
  const [quantityFor, setQuantityFor] = useState<EventSession | null>(null);
  const selected = event.sessions.find((s) => s.id === selectedId) ?? null;

  function pick(s: EventSession) {
    if (!sessionAvailability(s).bookable) {
      setFull(true);
      return;
    }
    setSelectedId(s.id);
    toast.success(`سانس انتخاب شد: ${faFullDate(s.start_time)}، ساعت ${faTime(s.start_time)}`);
  }

  function proceed() {
    if (!selected) return;
    if (selected.has_seat_map) router.push(`/sessions/${selected.id}/seats`);
    else setQuantityFor(selected);
  }

  return (
    <div className="container-page pb-28 pt-1.5 lg:pb-10">
      <EventHero title={event.title} line={[event.hall_name, event.venue_name, event.city_name].filter(Boolean).join(" ")} banner={event.banner_url} fallback={event.category_cover_url} />
      <h2 className="mb-[9px] mt-[19px] text-[15px] font-black text-ink">تاریخ و سانس موردنظر</h2>
      {event.sessions.length === 0 ? (
        <EmptyState message="سانسی برای این رویداد ثبت نشده است." description="زمان برگزاری به‌زودی اعلام می‌شود." />
      ) : (
        <div role="radiogroup" aria-label="سانس‌ها" className="grid gap-3 lg:grid-cols-2">
          {event.sessions.map((s) => {
            const a = sessionAvailability(s);
            const on = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(s)}
                className={cn("card block w-full p-4 text-right transition", on && "!border-2 !border-[#7739e9]", !a.bookable && "opacity-60")}
              >
                <b className="block text-[14px] text-ink">{faFullDate(s.start_time)}</b>
                {s.title && <span className="block text-[12px] text-muted">{s.title}</span>}
                <span className="mt-1 block text-[12px] leading-[2] text-muted">
                  <span className="tabular">{faTime(s.start_time)}</span> · {a.label}
                </span>
                <span className="mt-1 inline-block rounded-full bg-success-bg px-[11px] py-[5px] text-[10px] text-success-fg">از {faNumber(s.from_price)} تومان</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-30 bg-gradient-to-t from-page via-page/80 to-transparent lg:bg-none px-4 pb-3 pt-6 lg:static lg:mt-5 lg:p-0">
        <Button size="xl" block disabled={!selected || event.status === "CANCELLED"} onClick={proceed}>
          {selected && !selected.has_seat_map ? "ادامه و انتخاب تعداد" : "ادامه و انتخاب صندلی"}
          <ArrowLeft className="size-5" />
        </Button>
      </div>

      {full && <StateDialog symbol={SYMBOL.wait} title="ظرفیت این سانس تکمیل است" message="لطفاً سانس دیگری انتخاب کنید." onAction={() => setFull(false)} />}
      {quantityFor && (
        <QuantityDialog
          session={quantityFor}
          open
          onClose={() => setQuantityFor(null)}
          onConfirm={(quantity) => {
            const target = `/checkout?session=${quantityFor.id}&quantity=${quantity}`;
            router.push(authenticated ? target : loginHref(target));
          }}
        />
      )}
    </div>
  );
}
