"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus, Info, Smartphone } from "lucide-react";
import { useTicket } from "./queries";
import { ticketService } from "@/services/ticket.service";
import { downloadCalendarFile } from "./calendar";
import { usePageBlock } from "@/hooks/useContent";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { TicketCard } from "@/components/shared/TicketCard";
import { Icon } from "@/components/ui/Icon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/States";
import { errorMessage, isStatus } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faDate, faDateTime, faFullDate, faTime } from "@/lib/format";
import type { TicketDetail } from "@/types/order";

export function TicketView({ id }: { id: number }) {
  const ticket = useTicket(id);
  const bar = <PageTopBar title="بلیت من" fallbackHref="/tickets" />;
  if (isStatus(ticket.error, 404)) return <>{bar}<ErrorState className="container-page my-8" message="بلیت موردنظر پیدا نشد." /></>;
  if (ticket.isError && !ticket.data) return <>{bar}<ErrorState className="container-page my-8" message={errorMessage(ticket.error)} onRetry={() => ticket.refetch()} /></>;
  if (!ticket.data) return <>{bar}<TicketSkeleton /></>;
  return (
    <>
      {bar}
      <Ticket t={ticket.data} />
    </>
  );
}

function Ticket({ t }: { t: TicketDetail }) {
  const { block: guide } = usePageBlock("TICKET_GUIDE");
  const cancelled = t.status === "CANCELLED" || t.session_status === "CANCELLED";
  const sendSms = useMutation({
    mutationFn: () => ticketService.sendSms(t.id),
    onSuccess: ({ message }) => toast.success(message ?? "بلیت پیامک شد."),
    onError: (e) => toast.error(errorMessage(e)),
  });

  async function share() {
    const text = `${t.event_title} - ${faFullDate(t.start_time)} ساعت ${faTime(t.start_time)} - ${[t.hall_name, t.city_name].join("، ")}`;
    try {
      if (navigator.share) await navigator.share({ title: t.event_title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("مشخصات بلیت کپی شد.");
      }
    } catch {
      // Share sheet dismissed.
    }
  }

  const tips = (guide?.subtitle ?? "").split("\n").filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-[752px] space-y-3.5 px-4 pb-10 pt-1 sm:px-6 lg:pt-8">
      <div className="hidden items-center justify-between lg:flex" data-print-hidden>
        <p className="text-[26px] font-black text-ink">بلیت من</p>
        <ButtonLink href="/tickets" variant="outline" size="sm">
          بلیت‌های من
          <ArrowLeft className="size-[18px]" />
        </ButtonLink>
      </div>

      <TicketCard t={t}>
        <div className="grid grid-cols-2 gap-2.5">
          <Button size="lg" onClick={() => window.print()} disabled={cancelled} className="h-14 rounded-2xl">
            <Icon name="common/download" className="size-[22px]" />
            دانلود بلیت
          </Button>
          <Button size="lg" variant="outline" onClick={share} className="h-14 rounded-2xl border-brand-100 text-brand-600">
            <Icon name="common/share" className="size-[22px]" />
            اشتراک‌گذاری
          </Button>
          <Button size="md" variant="ghost" onClick={() => downloadCalendarFile(t)} disabled={cancelled} className="text-[13px] text-ink-2">
            <CalendarPlus className="size-5" />
            افزودن به تقویم
          </Button>
          <Button size="md" variant="ghost" onClick={() => sendSms.mutate()} loading={sendSms.isPending} disabled={cancelled} className="text-[13px] text-ink-2">
            <Smartphone className="size-5" />
            ارسال به موبایل
          </Button>
        </div>
      </TicketCard>

      {tips.length > 0 && (
        <section aria-labelledby="guide-title" className="flex gap-3 rounded-2xl bg-brand-50/70 p-4" data-print-hidden>
          <Info className="mt-0.5 size-7 shrink-0 text-brand-600" />
          <div>
            <h2 id="guide-title" className="text-[15px] font-black text-brand-600">
              {guide?.title ?? "نکات مهم"}
            </h2>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-6 text-ink-2">
              {tips.map((line) => {
                const [head, ...rest] = line.split(":");
                const body = rest.join(":").trim();
                return <li key={line}>{body ? <><b className="font-bold text-ink">{head}:</b> {body}</> : line}</li>;
              })}
            </ul>
          </div>
        </section>
      )}
      <p className="sr-only">
        تاریخ صدور بلیت: {faDate(t.created_at)}، تاریخ خرید: {faDateTime(t.paid_at ?? t.ordered_at)}، شماره بلیت: {t.ticket_code}
      </p>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[752px] space-y-3.5 px-4 pt-1 sm:px-6 lg:pt-8" aria-busy>
      <Skeleton className="h-[760px] rounded-[24px]" />
    </div>
  );
}
