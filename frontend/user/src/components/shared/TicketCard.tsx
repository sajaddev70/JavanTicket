import { QRCodeSVG } from "qrcode.react";
import { TicketStatusBadge } from "@/features/tickets/TicketStatusBadge";
import { faFullDate, faNumber, faTime, groupCode } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { TicketDetail } from "@/types/order";

/**
 * The electronic ticket: the design's glass card with the QR, also the only part printed by "دانلود بلیت".
 * Every value comes from GET /user/tickets/{id}; the QR is drawn from the backend's `qr_code` exactly as issued.
 */
export function TicketCard({ t, children }: { t: TicketDetail; children?: React.ReactNode }) {
  const cancelled = t.status === "CANCELLED" || t.session_status === "CANCELLED";
  const seat = t.seat_number ? `ردیف ${t.row_label ?? "—"} صندلی ${faNumber(t.seat_number)}` : (t.seat_label ?? "ورود عمومی");
  return (
    <article data-print-area aria-label="بلیت" className="card p-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-[17px] font-black text-ink">بلیت الکترونیکی</h2>
        <TicketStatusBadge status={t.status} sessionCancelled={t.session_status === "CANCELLED"} />
      </div>
      <p className="mt-0.5 hidden text-[15px] font-bold print:block">{t.event_title}</p>
      <div className={cn("mx-auto mt-3.5 w-fit rounded-[13px] bg-white p-3", cancelled && "opacity-25 grayscale")}>
        <QRCodeSVG value={t.qr_code} size={180} level="M" marginSize={0} bgColor="#ffffff" fgColor="#142452" title="کد QR بلیت" />
      </div>
      <p className="mt-3 text-[14px] font-bold text-ink">
        کد بلیت:{" "}
        <span dir="ltr" className="font-code">
          {groupCode(t.qr_code)}
        </span>
      </p>
      <p className="mt-0.5 text-[12px] leading-[2] text-muted">
        {faFullDate(t.start_time)} · {faTime(t.start_time)} · {seat}
      </p>
      <p className="text-[12px] leading-[2] text-muted">{[t.hall_name, t.venue_name, t.city_name].filter(Boolean).join("، ")}</p>
      {cancelled && <p className="mt-1 text-[12px] font-bold text-danger-fg">این بلیت معتبر نیست.</p>}
      <dl className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-line pt-3 text-[12px] text-muted">
        <div className="flex gap-1">
          <dt>خریدار:</dt>
          <dd className="font-bold text-ink">{t.buyer_name ?? "—"}</dd>
        </div>
        <div className="flex gap-1">
          <dt>شماره سفارش:</dt>
          <dd dir="ltr" className="font-code font-bold text-ink">
            {t.order_number}
          </dd>
        </div>
      </dl>
      {children && (
        <div className="mt-3" data-print-hidden>
          {children}
        </div>
      )}
    </article>
  );
}
