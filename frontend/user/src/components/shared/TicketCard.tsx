import { QRCodeSVG } from "qrcode.react";
import { Armchair, Layers, Rows3 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Icon } from "@/components/ui/Icon";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";
import { faFullDate, faNumber, faTime, groupCode } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { TicketDetail } from "@/types/order";

/** Dashed tear line with the two notches of a paper ticket. */
function Perforation() {
  return (
    <div className="relative my-1 h-6" aria-hidden>
      <span className="absolute -right-3 top-0 size-6 rounded-full bg-page" />
      <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-line" />
      <span className="absolute -left-3 top-0 size-6 rounded-full bg-page" />
    </div>
  );
}

/**
 * The electronic ticket (reference 10), also the only part printed by "دانلود بلیت".
 * Every value comes from GET /user/tickets/{id}; the QR is drawn from the backend's `qr_code` exactly as issued.
 */
export function TicketCard({ t, children }: { t: TicketDetail; children?: React.ReactNode }) {
  const cancelled = t.status === "CANCELLED" || t.session_status === "CANCELLED";
  const cells = t.seat_number
    ? [
        { icon: <Layers className="size-5" />, label: "بخش", value: t.section_name ?? t.hall_name },
        { icon: <Rows3 className="size-5" />, label: "ردیف", value: t.row_label ?? "—" },
        { icon: <Armchair className="size-5" />, label: "صندلی", value: faNumber(t.seat_number) },
        { icon: <Icon name="common/ticket" className="size-5" />, label: "نوع بلیت", value: t.tier_name ?? "عادی" },
      ]
    : [
        { icon: <Layers className="size-5" />, label: "سالن", value: t.hall_name },
        { icon: <Icon name="common/ticket" className="size-5" />, label: "نوع بلیت", value: t.seat_label ?? "ورود عمومی" },
      ];

  return (
    <article data-print-area aria-label="بلیت" className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-card">
      <div className="relative min-h-[150px] overflow-hidden bg-navy-950 text-white sm:min-h-[180px]">
        <SmartImage src={mediaUrl(t.banner_url)} fallback={null} alt="" fill preload sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0b2b5b]/95 via-[#0b2b5b]/60 to-transparent" />
        <div className="relative max-w-[75%] p-5 sm:p-6">
          <h1 className="text-[24px] font-black leading-[1.45] sm:text-[28px]">{t.event_title}</h1>
          {(t.session_title || t.event_subtitle) && <p className="mt-1 text-[14px] text-white/85">{t.session_title ?? t.event_subtitle}</p>}
        </div>
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <ul className="space-y-3 text-[15px] font-bold text-ink">
            <li className="flex items-center gap-3">
              <Icon name="common/calendar-simple" className="size-6 text-brand-600" />
              {faFullDate(t.start_time)}
            </li>
            <li className="flex items-center gap-3">
              <Icon name="common/location" className="size-6 text-brand-600" />
              {t.city_name}
            </li>
            <li className="flex items-center gap-3">
              <Icon name="common/halls" className="size-6 text-brand-600" />
              {[t.venue_name, t.hall_name].filter(Boolean).join("، ")}
            </li>
            <li className="flex items-center gap-3">
              <Icon name="common/clock" className="size-6 text-brand-600" />
              ساعت <span className="tabular">{faTime(t.start_time)}</span>
            </li>
          </ul>
          <TicketStatusBadge status={t.status} sessionCancelled={t.session_status === "CANCELLED"} className="shrink-0 text-[13px]" />
        </div>
      </div>

      <Perforation />

      <dl className={cn("grid gap-2 px-4 sm:px-6", cells.length === 4 ? "grid-cols-4" : "grid-cols-2")}>
        {cells.map((c) => (
          <div key={c.label} className="rounded-2xl bg-surface-2 px-1.5 py-3 text-center">
            <dt className="flex items-center justify-center gap-1 whitespace-nowrap text-[12px] text-ink-2">
              <span className="text-brand-600 [&>*]:size-[18px]">{c.icon}</span>
              {c.label}
            </dt>
            <dd className="mt-1.5 line-clamp-2 break-words text-[14.5px] font-black leading-6 text-ink">{c.value}</dd>
          </div>
        ))}
      </dl>

      <Perforation />

      <div className="flex flex-col items-center px-4 text-center sm:px-6">
        <div className={cn("rounded-2xl border border-line bg-white p-3", cancelled && "opacity-25 grayscale")}>
          <QRCodeSVG value={t.qr_code} size={168} level="M" marginSize={0} bgColor="#ffffff" fgColor="#101828" title="کد QR بلیت" />
        </div>
        <p className="font-code mt-3 text-[18px] font-bold tracking-widest text-ink" dir="ltr">
          {groupCode(t.qr_code)}
        </p>
        <p className="mt-1 text-[13px] text-muted">{cancelled ? "این بلیت معتبر نیست." : "این QR Code را در ورودی اسکن کنید."}</p>
      </div>

      <dl className="mx-4 mt-4 grid grid-cols-2 divide-x divide-line rounded-2xl bg-surface-2 py-3 text-[13px] sm:mx-6">
        <div className="flex items-center gap-2.5 px-4">
          <Icon name="common/profile" className="size-6 shrink-0 text-brand-600" />
          <div className="min-w-0">
            <dt className="text-muted">خریدار</dt>
            <dd className="truncate text-[14.5px] font-black text-ink">{t.buyer_name ?? "—"}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4">
          <Icon name="common/invoice" className="size-6 shrink-0 text-brand-600" />
          <div className="min-w-0">
            <dt className="text-muted">شماره سفارش</dt>
            <dd className="font-code truncate text-[13.5px] font-bold text-ink" dir="ltr">
              {t.order_number}
            </dd>
          </div>
        </div>
      </dl>

      <div className="p-4 sm:p-6" data-print-hidden>
        {children}
      </div>
    </article>
  );
}
