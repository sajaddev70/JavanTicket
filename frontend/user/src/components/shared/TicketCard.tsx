import { QRCodeSVG } from "qrcode.react";
import { Armchair } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Icon } from "@/components/ui/Icon";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";
import { faDayMonth, faFullDate, faNumber, faTime, groupCode } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { TicketDetail } from "@/types/order";

/** Dashed tear line with the two notches of a paper ticket. */
function Perforation() {
  return (
    <div className="relative my-2 h-6" aria-hidden>
      <span className="absolute -right-3 top-0 size-6 rounded-full bg-page shadow-[inset_2px_0_4px_rgb(60_40_160/0.12)]" />
      <span className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-line-strong" />
      <span className="absolute -left-3 top-0 size-6 rounded-full bg-page shadow-[inset_-2px_0_4px_rgb(60_40_160/0.12)]" />
    </div>
  );
}

/**
 * The electronic ticket (reference 09), also the only part printed by "دانلود بلیت".
 * Every value comes from GET /user/tickets/{id}; the QR is drawn from the backend's `qr_code` exactly as issued.
 */
export function TicketCard({ t, children }: { t: TicketDetail; children?: React.ReactNode }) {
  const cancelled = t.status === "CANCELLED" || t.session_status === "CANCELLED";
  const facts = [
    { label: "تاریخ", value: faDayMonth(t.start_time) },
    { label: "ساعت", value: faTime(t.start_time) },
    { label: t.seat_number ? "صندلی" : "سالن", value: t.seat_number ? `${t.row_label ? `${t.row_label}-` : ""}${faNumber(t.seat_number)}` : t.hall_name },
  ];

  return (
    <article
      data-print-area
      aria-label="بلیت"
      className="relative overflow-hidden rounded-[26px] bg-surface shadow-[0_0_0_1.5px_rgb(174_102_255/0.6),0_18px_48px_rgb(123_53_246/0.28)]"
    >
      {/* Poster strip */}
      <div className="relative aspect-[16/6] overflow-hidden bg-navy-950">
        <SmartImage src={mediaUrl(t.banner_url)} fallback={null} alt="" fill preload sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1060]/70 to-transparent" />
        <TicketStatusBadge status={t.status} sessionCancelled={t.session_status === "CANCELLED"} className="absolute left-3 top-3 text-[12.5px]" />
      </div>

      <Perforation />

      <div className="px-5 text-center sm:px-8">
        <h1 className="text-[20px] font-black leading-[1.6] text-ink sm:text-[24px]">{t.event_title}</h1>
        {(t.session_title || t.event_subtitle) && <p className="mt-0.5 text-[13.5px] text-muted">{t.session_title ?? t.event_subtitle}</p>}
        <div className={cn("mx-auto mt-4 w-fit rounded-2xl bg-white p-3", cancelled && "opacity-25 grayscale")}>
          <QRCodeSVG value={t.qr_code} size={176} level="M" marginSize={0} bgColor="#ffffff" fgColor="#11143a" title="کد QR بلیت" />
        </div>
        <p className="mt-3 text-[13.5px] font-bold text-ink-2">کد بلیت</p>
        <p className="font-code mt-0.5 text-[24px] font-black tracking-[0.18em] text-ink" dir="ltr">
          {groupCode(t.qr_code)}
        </p>
        <p className="mt-1 text-[12.5px] text-muted">{cancelled ? "این بلیت معتبر نیست." : "این QR Code را در ورودی اسکن کنید."}</p>
      </div>

      <Perforation />

      <dl className="mx-4 grid grid-cols-3 divide-x divide-line rounded-[18px] border border-line bg-surface-2 sm:mx-6">
        {facts.map((f) => (
          <div key={f.label} className="px-2 py-3 text-center">
            <dt className="text-[12.5px] text-muted">{f.label}</dt>
            <dd className="mt-1 line-clamp-1 text-[16px] font-black text-ink tabular">{f.value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mx-4 mt-3 space-y-2.5 rounded-[18px] bg-surface-2 px-4 py-3.5 text-[13.5px] text-ink sm:mx-6">
        <li className="flex items-center gap-2.5">
          <Icon name="common/calendar-simple" className="size-5 shrink-0 text-purple" />
          {faFullDate(t.start_time)}
        </li>
        <li className="flex items-center gap-2.5">
          <Icon name="common/location" className="size-5 shrink-0 text-purple" />
          {[t.city_name, t.venue_name, t.hall_name].filter(Boolean).join("، ")}
        </li>
        {t.seat_number ? (
          <li className="flex items-center gap-2.5">
            <Armchair className="size-5 shrink-0 text-purple" />
            {[t.section_name, t.row_label && `ردیف ${t.row_label}`, `صندلی ${faNumber(t.seat_number)}`, t.tier_name].filter(Boolean).join(" • ")}
          </li>
        ) : (
          <li className="flex items-center gap-2.5">
            <Icon name="common/ticket" className="size-5 shrink-0 text-purple" />
            {t.seat_label ?? "ورود عمومی"}
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <Icon name="common/profile" className="size-5 shrink-0 text-purple" />
          <span className="min-w-0 flex-1 truncate">{t.buyer_name ?? "—"}</span>
          <span className="font-code text-[12.5px] text-muted" dir="ltr">
            {t.order_number}
          </span>
        </li>
      </ul>

      <div className="p-4 sm:p-6" data-print-hidden>
        {children}
      </div>
    </article>
  );
}
