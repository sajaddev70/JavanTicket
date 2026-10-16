"use client";

import { useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, CalendarDays, CalendarPlus, Info, MapPin, Printer, Share2, ShoppingCart, Smartphone } from "lucide-react";
import { useTicket } from "./queries";
import { ticketService } from "@/services/ticket.service";
import { downloadCalendarFile } from "./calendar";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { usePageBlock } from "@/hooks/useContent";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SmartImage } from "@/components/ui/SmartImage";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/States";
import { errorMessage, isStatus } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faDate, faDateTime, faFullDate, faNumber, faPrice, faTime, groupCode } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { TicketDetail } from "@/types/order";

export function TicketView({ id }: { id: number }) {
  const ticket = useTicket(id);
  if (isStatus(ticket.error, 404)) return <ErrorState className="container-page my-8" message="بلیت موردنظر پیدا نشد." />;
  if (ticket.isError && !ticket.data) return <ErrorState className="container-page my-8" message={errorMessage(ticket.error)} onRetry={() => ticket.refetch()} />;
  if (!ticket.data) return <TicketSkeleton />;
  return <Ticket t={ticket.data} />;
}

function Ticket({ t }: { t: TicketDetail }) {
  const { block: guide } = usePageBlock("TICKET_GUIDE");
  const cancelled = t.status === "CANCELLED" || t.session_status === "CANCELLED";
  const sendSms = useMutation({
    mutationFn: () => ticketService.sendSms(t.id),
    onSuccess: ({ message }) => toast.success(message ?? "بلیت پیامک شد."),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const seatCells = t.seat_number
    ? [
        { label: "سالن", value: t.hall_name },
        { label: "ردیف", value: t.row_label },
        { label: "شماره صندلی", value: faNumber(t.seat_number) },
        { label: "نوع بلیت", value: t.tier_name ?? "عادی" },
      ]
    : [
        { label: "سالن", value: t.hall_name },
        { label: "نوع بلیت", value: t.seat_label ?? "ورود عمومی" },
      ];

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

  return (
    <div className="container-page space-y-5 pb-10 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-4" data-print-hidden>
        <div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <h1 className="text-[26px] font-black text-ink sm:text-[30px]">بلیت الکترونیک</h1>
            <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "بلیت‌های من", href: "/tickets" }, { label: "بلیت الکترونیک" }]} />
          </div>
          <p className="mt-1 text-[13.5px] text-ink-2">لطفاً این بلیت را در زمان ورود به همراه داشته باشید.</p>
        </div>
        <ButtonLink href={`/events/${encodeURIComponent(t.event_slug)}`} variant="outline">
          بازگشت به رویداد
          <ArrowLeft className="size-5" />
        </ButtonLink>
      </div>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
        <aside aria-labelledby="ticket-summary" className="card order-2 p-4 sm:p-5 xl:order-1" data-print-hidden>
          <h2 id="ticket-summary" className="flex items-center gap-2 text-[18px] font-black text-ink">
            <ShoppingCart className="size-6 text-brand-600" />
            خلاصه خرید
          </h2>
          <div className="mt-4 flex gap-3 border-b border-line pb-4">
            <div className="min-w-0 flex-1 space-y-1 text-[13px] text-ink-2">
              <p className="text-[15px] font-black text-ink">{t.event_title}</p>
              <p>{faFullDate(t.start_time)}</p>
              <p>ساعت {faTime(t.start_time)}</p>
              <p>{[t.hall_name, t.city_name].join(" / ")}</p>
            </div>
            <div className="relative aspect-[4/5] w-[84px] shrink-0 overflow-hidden rounded-xl bg-field">
              <SmartImage src={mediaUrl(t.banner_url)} fallback={null} alt="" fill sizes="84px" className="object-cover" />
            </div>
          </div>
          <dl className="space-y-2.5 border-b border-line py-4 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-ink-2">تعداد بلیت سفارش</dt>
              <dd className="font-bold text-ink">{faNumber(t.order_tickets_count)} عدد</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">مبلغ این بلیت</dt>
              <dd className="font-bold text-ink">{faPrice(t.price)}</dd>
            </div>
          </dl>
          <div className="flex justify-between py-4 text-[15px]">
            <span className="font-black text-ink">جمع کل سفارش</span>
            <span className="text-[18px] font-black text-brand-600">{faPrice(t.order_total)}</span>
          </div>
          <div className="space-y-2.5">
            <Button size="lg" block onClick={() => window.print()} disabled={cancelled}>
              <Printer className="size-5" />
              دانلود PDF / چاپ بلیت
            </Button>
            <Button size="lg" block variant="soft" onClick={() => sendSms.mutate()} loading={sendSms.isPending} disabled={cancelled}>
              <Smartphone className="size-5" />
              ارسال به موبایل
            </Button>
            <Button size="lg" block variant="outline" onClick={share}>
              <Share2 className="size-5" />
              اشتراک‌گذاری
            </Button>
            <Button size="lg" block variant="outline" onClick={() => downloadCalendarFile(t)} disabled={cancelled}>
              <CalendarPlus className="size-5" />
              افزودن به تقویم
            </Button>
          </div>
        </aside>

        {/* The ticket itself; also the only part printed */}
        <article data-print-area aria-label="بلیت" className="card relative order-1 grid overflow-hidden p-0 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,0.75fr)] xl:order-2">
          <div className="flex flex-col items-center gap-3 border-b-2 border-dashed border-line-strong p-5 text-center lg:border-b-0 lg:border-l-2">
            <div className={cancelled ? "opacity-25 grayscale" : undefined}>
              <QRCodeSVG value={t.qr_code} size={168} level="M" marginSize={1} bgColor="#ffffff" fgColor="#0f1b33" title="کد QR بلیت" className="rounded-lg" />
            </div>
            <p className="font-code text-[17px] font-bold text-ink-2" dir="ltr">
              {groupCode(t.qr_code)}
            </p>
            <p className="text-[12.5px] leading-6 text-muted">این کد را در زمان ورود به اسکنر مجموعه نشان دهید.</p>
            <dl className="mt-1 w-full space-y-2 border-t border-dashed border-line-strong pt-3 text-right text-[13px]">
              {t.buyer_name && (
                <div>
                  <dt className="text-muted">نام خریدار</dt>
                  <dd className="text-[15px] font-black text-ink">{t.buyer_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">شماره سفارش</dt>
                <dd className="font-code font-bold text-ink-2" dir="ltr">
                  {t.order_number}
                </dd>
              </div>
              <div>
                <dt className="text-muted">شماره بلیت</dt>
                <dd className="font-code font-bold text-ink-2" dir="ltr">
                  {t.ticket_code}
                </dd>
              </div>
              <div className="text-[12px] text-muted">تاریخ خرید: {faDateTime(t.paid_at ?? t.ordered_at)}</div>
            </dl>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[14px] text-muted">بلیت الکترونیک</p>
              <TicketStatusBadge status={t.status} sessionCancelled={t.session_status === "CANCELLED"} />
            </div>
            <h2 className="mt-2 text-[22px] font-black leading-[1.5] text-ink sm:text-[26px]">{t.event_title}</h2>
            {(t.event_subtitle || t.session_title) && <p className="mt-1 text-[14px] text-ink-2">{t.session_title ?? t.event_subtitle}</p>}
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <CalendarDays className="size-6" />
                </span>
                <div>
                  <p className="text-[16px] font-black text-ink">{faFullDate(t.start_time)}</p>
                  <p className="mt-0.5 text-[13.5px] text-ink-2">
                    ساعت {faTime(t.start_time)} الی {faTime(t.end_time)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MapPin className="size-6" />
                </span>
                <div>
                  <p className="text-[16px] font-black text-ink">{t.city_name}</p>
                  <p className="mt-0.5 text-[13.5px] leading-6 text-ink-2">{[t.venue_name, t.hall_name, t.hall_address].filter(Boolean).join("، ")}</p>
                  {t.section_name && <p className="mt-1 text-[13.5px] font-bold text-brand-600">بخش {t.section_name}</p>}
                </div>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 divide-line rounded-2xl bg-surface-2 sm:flex sm:divide-x sm:divide-x-reverse">
              {seatCells.filter(Boolean).map((c) => {
                const cell = c as { label: string; value: string };
                return (
                  <div key={cell.label} className="flex-1 px-3 py-3 text-center">
                    <dt className="text-[12.5px] text-muted">{cell.label}</dt>
                    <dd className="mt-1 text-[16px] font-black leading-7 text-ink">{cell.value}</dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="relative hidden min-h-[320px] overflow-hidden bg-navy-950 lg:block">
            <SmartImage src={mediaUrl(t.banner_url)} fallback={null} alt="" fill sizes="(min-width: 1024px) 25vw, 0px" className="object-cover" />
            {t.category_name && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-bold text-white shadow" style={{ background: t.category_color ?? "#4f46e5" }}>
                <CategoryIcon iconUrl={t.category_icon_url} className="size-4" />
                {t.category_name}
              </span>
            )}
          </div>
        </article>
      </div>

      {guide && <TicketGuide title={guide.title} lines={(guide.subtitle ?? "").split("\n").filter(Boolean)} />}
      <p className="sr-only">تاریخ صدور بلیت: {faDate(t.created_at)}</p>
    </div>
  );
}

/** "راهنمای ورود به سالن" steps; each line of the content block is "عنوان: توضیح". */
function TicketGuide({ title, lines }: { title?: string | null; lines: string[] }) {
  return (
    <section aria-labelledby="guide-title" className="card p-4 sm:p-5" data-print-hidden>
      <h2 id="guide-title" className="mb-4 flex items-center gap-2 text-[18px] font-black text-ink">
        <Info className="size-6 text-brand-600" />
        {title}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {lines.map((line, i) => {
          const [head, ...rest] = line.split(":");
          const body = rest.join(":").trim();
          return (
            <li key={line} className="flex gap-3 rounded-2xl border border-line p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[14px] font-black text-white">{faNumber(i + 1)}</span>
              <div>
                <p className="text-[15px] font-black text-ink">{body ? head : line}</p>
                {body && <p className="mt-1 text-[13px] leading-6 text-ink-2">{body}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TicketSkeleton() {
  return (
    <div className="container-page space-y-5 pt-5" aria-busy>
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <Skeleton className="h-[480px] rounded-[18px]" />
        <Skeleton className="h-[480px] rounded-[18px]" />
      </div>
    </div>
  );
}
