import type { TicketDetail } from "@/types/order";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (text: string) => text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** Saves an .ics file of the ticket's session so it can be added to any calendar app. */
export function downloadCalendarFile(ticket: TicketDetail) {
  const location = [ticket.hall_name, ticket.venue_name, ticket.hall_address ?? ticket.city_name].filter(Boolean).join("، ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JavanTicket//FA",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:ticket-${ticket.id}-${ticket.ticket_code}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(ticket.start_time)}`,
    `DTEND:${stamp(ticket.end_time)}`,
    `SUMMARY:${escape(ticket.event_title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(`بلیت ${ticket.ticket_code}${ticket.seat_label ? ` - ${ticket.seat_label}` : ""}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ticket-${ticket.ticket_code}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
