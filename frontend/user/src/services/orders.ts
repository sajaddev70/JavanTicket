import { apiGet, apiPost } from "./api";

export interface OrderSeat {
  id: number;
  row_label: string;
  seat_number: number;
  tier_name?: string | null;
  price: number;
  ticket_code?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: "PENDING" | "PAID" | "CANCELLED" | string;
  total_amount: number;
  discount_code?: string | null;
  discount_amount?: number | null;
  quantity?: number | null;
  unit_price: number;
  created_at: string;
  paid_at?: string | null;
  held_until?: string | null;
  session_id: number;
  start_time: string;
  event_title: string;
  event_slug: string;
  banner_url?: string | null;
  hall_name: string;
  city_name: string;
  seats: OrderSeat[];
  tickets: { ticket_code: string; seat_label?: string | null; price: number }[];
  payment_available: boolean;
}

export const ordersApi = {
  checkout: (body: { session_id: number; seat_ids?: number[]; quantity?: number; discount_code?: string | null }) =>
    apiPost<{ order_number: string }>("/user/orders", body),
  get: (number: string) => apiGet<Order>(`/user/orders/${encodeURIComponent(number)}`),
  pay: (number: string) => apiPost<void>(`/user/orders/${encodeURIComponent(number)}/pay`),
};
