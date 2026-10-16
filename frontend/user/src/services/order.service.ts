import { http } from "./api";
import { getHoldToken } from "@/stores/holdToken";
import type { Paged } from "@/types/event";
import type { BuyerInput, Order, OrderListItem, OrderStatus } from "@/types/order";

const path = (number: string) => `/user/orders/${encodeURIComponent(number)}`;

/** Checkout: the backend creates the order from the held seats and computes every amount. */
export const orderService = {
  /** Order draft from the seats this browser holds (seat map) or a ticket count (general admission). */
  create: (sessionId: number, quantity?: number) =>
    http.post<{ order_number: string }>("/user/orders", { session_id: sessionId, hold_token: getHoldToken(), quantity }),
  list: (params: { status?: OrderStatus | ""; page?: number; size?: number }) => http.get<Paged<OrderListItem>>("/user/orders", params),
  get: (number: string) => http.get<Order>(path(number)),
  updateBuyer: (number: string, buyer: BuyerInput) => http.put<Order>(`${path(number)}/buyer`, buyer),
  applyDiscount: (number: string, code: string) => http.post<Order>(`${path(number)}/discount`, { code }),
  removeDiscount: (number: string) => http.delete<Order>(`${path(number)}/discount`),
};
