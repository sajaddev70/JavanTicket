import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ticketService } from "@/services/ticket.service";
import { queryKeys } from "@/constants/queryKeys";
import { isStatus } from "@/services/api";
import type { TicketScope } from "@/types/order";

export const useTickets = (scope: TicketScope, page: number) =>
  useQuery({ queryKey: queryKeys.tickets({ scope, page }), queryFn: () => ticketService.list({ scope, page, size: 12 }), placeholderData: keepPreviousData });

export const useTicket = (id: number) =>
  useQuery({ queryKey: queryKeys.ticket(id), queryFn: () => ticketService.get(id), enabled: id > 0, retry: (n, err) => !isStatus(err, 404) && n < 2 });
