import { http, requestWithMessage } from "./api";
import type { TicketDetail, TicketPage, TicketScope } from "@/types/order";

export const ticketService = {
  list: (params: { scope: TicketScope; page?: number; size?: number }) => http.get<TicketPage>("/user/tickets", params),
  get: (id: number) => http.get<TicketDetail>(`/user/tickets/${id}`),
  /** SMS with the event, time, seat and entry code to the buyer's mobile (at most once a minute). */
  sendSms: (id: number) => requestWithMessage<{ mobile: string }>({ method: "POST", url: `/user/tickets/${id}/send-sms` }),
};
