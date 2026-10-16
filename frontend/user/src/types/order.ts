/** Orders, payments and tickets of the signed-in user (GET /user/...). */

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

export interface OrderSeat {
  id: number;
  row_label: string;
  seat_number: number;
  section_name?: string | null;
  tier_code?: string | null;
  tier_name?: string | null;
  tier_color?: string | null;
  price: number;
}

export interface OrderTicket {
  id: number;
  ticket_code: string;
  seat_label?: string | null;
  price: number;
  status: TicketStatus;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  total_amount: number;
  discount_code?: string | null;
  discount_amount?: number | null;
  /** Service fee, already included in total_amount. */
  service_fee: number;
  quantity?: number | null;
  unit_price: number;
  created_at: string;
  paid_at?: string | null;
  tracking_code?: string | null;
  payment_method?: string | null;
  buyer_first_name?: string | null;
  buyer_last_name?: string | null;
  buyer_mobile?: string | null;
  buyer_email?: string | null;
  buyer_note?: string | null;
  user_mobile: string;
  user_first_name?: string | null;
  user_last_name?: string | null;
  user_email?: string | null;
  session_id: number;
  start_time: string;
  end_time: string;
  event_title: string;
  event_subtitle?: string | null;
  event_slug: string;
  banner_url?: string | null;
  category_name?: string | null;
  hall_name: string;
  venue_name?: string | null;
  hall_address?: string | null;
  city_name: string;
  /** Deadline of the seat hold (seat-mapped) or of the order (general admission). */
  expires_at?: string | null;
  /** Seconds until expires_at by the server's clock; null unless PENDING. */
  seconds_left: number | null;
  payable: boolean;
  seats: OrderSeat[];
  tickets: OrderTicket[];
}

export interface OrderListItem {
  id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  discount_amount?: number | null;
  quantity?: number | null;
  created_at: string;
  paid_at?: string | null;
  tracking_code?: string | null;
  payment_method?: string | null;
  session_id: number;
  start_time: string;
  event_title: string;
  event_slug: string;
  banner_url?: string | null;
  hall_name: string;
  city_name: string;
  tickets_count: number;
  first_ticket_id?: number | null;
}

export interface BuyerInput {
  first_name: string;
  last_name: string;
  mobile: string;
  email?: string | null;
  note?: string | null;
}

export interface PaymentMethod {
  code: string;
  title: string;
  description?: string | null;
  logo_url?: string | null;
}

export type PaymentStatus = "INITIATED" | "SUCCESS" | "FAILED";

export interface PaymentResult {
  id: number;
  status: PaymentStatus;
  gateway: string;
  gateway_title: string;
  amount: number;
  reference_id?: string | null;
  tracking_code?: string | null;
  card_pan?: string | null;
  failure_reason?: string | null;
  created_at: string;
  verified_at?: string | null;
  order_number: string;
  order_status: OrderStatus;
  order: Order;
}

export type TicketStatus = "VALID" | "USED" | "CANCELLED";
export type TicketScope = "upcoming" | "past" | "cancelled";

export interface TicketListItem {
  id: number;
  ticket_code: string;
  seat_label?: string | null;
  price: number;
  status: TicketStatus;
  used_at?: string | null;
  created_at: string;
  session_id: number;
  start_time: string;
  end_time: string;
  event_title: string;
  event_slug: string;
  banner_url?: string | null;
  category_name?: string | null;
  category_color?: string | null;
  hall_name: string;
  venue_name?: string | null;
  city_name: string;
  order_number: string;
}

export interface TicketPage {
  items: TicketListItem[];
  total: number;
  page: number;
  size: number;
  counts: Record<TicketScope, number>;
}

export interface TicketDetail {
  id: number;
  ticket_code: string;
  /** Random payload of the QR code, verified at the gate. */
  qr_code: string;
  seat_label?: string | null;
  price: number;
  status: TicketStatus;
  used_at?: string | null;
  created_at: string;
  row_label?: string | null;
  seat_number?: number | null;
  section_name?: string | null;
  tier_name?: string | null;
  tier_color?: string | null;
  session_id: number;
  session_title?: string | null;
  start_time: string;
  end_time: string;
  session_status: string;
  event_title: string;
  event_subtitle?: string | null;
  event_slug: string;
  banner_url?: string | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon_url?: string | null;
  hall_name: string;
  venue_name?: string | null;
  hall_address?: string | null;
  city_name: string;
  order_number: string;
  order_status: OrderStatus;
  ordered_at: string;
  paid_at?: string | null;
  order_total: number;
  order_tickets_count: number;
  buyer_name?: string | null;
  buyer_mobile?: string | null;
}
