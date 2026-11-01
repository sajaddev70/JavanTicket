"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CalendarPlus, Smartphone } from "lucide-react";
import { useTicket } from "./queries";
import { ticketService } from "@/services/ticket.service";
import { downloadCalendarFile } from "./calendar";
import { usePageBlock } from "@/hooks/useContent";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { InfoBanner } from "@/components/shared/CheckoutSteps";
import { TicketCard } from "@/components/shared/TicketCard";
import { EventHero } from "@/features/events/detail/EventDetailView";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/States";
import { LoadingOverlay, StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage, isStatus } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faDate, faDateTime, faFullDate, faTime } from "@/lib/format";
import type { TicketDetail } from "@/types/order";

/** 14 بلیت الکترونیکی: عادی، بلیت منقضی، خطای نمایش کد. */
export function TicketView({ id }: { id: number }) {
  const router = useRouter();
  const ticket = useTicket(id);
  const bar = <PageTopBar title="بلیت الکترونیکی" fallbackHref="/tickets" />;
  if (isStatus(ticket.error, 404)) return <>{bar}<EmptyState className="container-page" symbol={SYMBOL.ticket} message="بلیت موردنظر پیدا نشد." /></>;
  if (ticket.isError && !ticket.data) {
    return (
      <>
        {bar}
        <StateDialog
          symbol={SYMBOL.warning}
          title="نمایش کد امکان‌پذیر نیست"
          message={/اتصال|ارتباط/.test(errorMessage(ticket.error)) ? "اتصال اینترنت را بررسی و دوباره تلاش کنید." : "برای دریافت مجدد اطلاعات بلیت تلاش کنید."}
          actionLabel="تلاش مجدد"
          onAction={() => ticket.refetch()}
          onDismiss={() => router.push("/tickets")}
        />
      </>
    );
  }
  if (!ticket.data) return <>{bar}<LoadingOverlay title="در حال بارگذاری" message="لطفاً چند لحظه منتظر بمانید." /></>;
  return (
    <>
      {bar}
      <Ticket t={ticket.data} receivedAt={ticket.dataUpdatedAt} />
    </>
  );
}

function Ticket({ t, receivedAt }: { t: TicketDetail; receivedAt: number }) {
  const { block: guide } = usePageBlock("TICKET_GUIDE");
  const [noticeSeen, setNoticeSeen] = useState(false);
  const cancelled = t.status === "CANCELLED" || t.session_status === "CANCELLED";
  // The moment the server answered, not the render's clock: the check stays the same while the page is open.
  const ended = new Date(t.end_time).getTime() < receivedAt;
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
    <div className="mx-auto w-full max-w-[640px] space-y-3 px-4 pb-10 pt-1.5 sm:px-6">
      <div data-print-hidden>
        <EventHero title={t.event_title} line={t.session_title ?? t.event_subtitle ?? undefined} banner={t.banner_url} className="[&>div:last-child]:min-h-[96px] lg:[&>div:last-child]:min-h-[120px]" />
      </div>
      <TicketCard t={t} />
      <div data-print-hidden className="space-y-2.5">
        <InfoBanner center>این کد را هنگام ورود نشان دهید</InfoBanner>
        <Button size="lg" block onClick={() => window.print()} disabled={cancelled}>
          <Icon name="common/download" className="size-5" />
          دانلود بلیت
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button size="lg" variant="outline" onClick={share}>
            <Icon name="common/share" className="size-5" />
            اشتراک‌گذاری
          </Button>
          <Button size="lg" variant="outline" onClick={() => sendSms.mutate()} loading={sendSms.isPending} disabled={cancelled}>
            <Smartphone className="size-5" />
            ارسال پیامک
          </Button>
        </div>
        <Button size="lg" variant="outline" block onClick={() => downloadCalendarFile(t)} disabled={cancelled}>
          <CalendarPlus className="size-5" />
          افزودن به تقویم
        </Button>
      </div>

      {tips.length > 0 && (
        <section aria-labelledby="guide-title" className="card p-4" data-print-hidden>
          <h2 id="guide-title" className="text-[15px] font-black text-ink">
            {guide?.title ?? "نکات مهم"}
          </h2>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-6 text-muted">
            {tips.map((line) => {
              const [head, ...rest] = line.split(":");
              const body = rest.join(":").trim();
              return <li key={line}>{body ? <><b className="font-bold text-ink">{head}:</b> {body}</> : line}</li>;
            })}
          </ul>
        </section>
      )}
      <p className="sr-only">
        تاریخ صدور بلیت: {faDate(t.created_at)}، تاریخ خرید: {faDateTime(t.paid_at ?? t.ordered_at)}، شماره بلیت: {t.ticket_code}
      </p>
      {ended && t.status === "VALID" && !cancelled && !noticeSeen && (
        <StateDialog symbol={SYMBOL.wait} title="اعتبار بلیت به پایان رسیده" message="تاریخ برگزاری این رویداد گذشته است." onAction={() => setNoticeSeen(true)} />
      )}
    </div>
  );
}
