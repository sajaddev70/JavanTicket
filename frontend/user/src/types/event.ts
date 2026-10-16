/** Events, sessions and seat maps (GET /public/events..., /public/sessions/...). */

export interface PublicEvent {
  id: number;
  title: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  notice?: string | null;
  banner_url?: string | null;
  organizer_name?: string | null;
  website_url?: string | null;
  min_price?: number | null;
  featured: boolean;
  popular: boolean;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  next_session_at?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  category_color?: string | null;
  category_icon_url?: string | null;
  category_cover_url?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  hall_name?: string | null;
  venue_name?: string | null;
  hall_address?: string | null;
}

export interface EventSession {
  id: number;
  title?: string | null;
  start_time: string;
  end_time: string;
  price: number;
  from_price: number;
  capacity: number;
  reserved_seats: number;
  available_seats: number;
  status: "ACTIVE" | "SCHEDULED" | string;
  hall_name: string;
  city_name: string;
  has_seat_map: boolean;
}

export interface EventDetail extends PublicEvent {
  sessions: EventSession[];
  first_start?: string | null;
  last_end?: string | null;
  sold_count: number;
  stats: { value: string; label: string; icon_url?: string | null; color?: string | null }[];
  topics: { title: string; icon_url?: string | null; color?: string | null }[];
  speakers: { full_name: string; job_title?: string | null; organization?: string | null; photo_url?: string | null; keynote: boolean }[];
  gallery: { image_url: string; caption?: string | null }[];
  faqs: { question: string; answer: string }[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export type EventSort = "newest" | "soonest" | "price";
export type EventWhen = "today" | "week" | "month";

/** Filters of the events page; mirrored in the URL search params. */
export interface EventFilters {
  q?: string;
  cityId?: number | null;
  category?: string;
  when?: EventWhen | "";
  section?: "featured" | "popular" | "";
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: EventSort;
  page?: number;
  size?: number;
}

export interface EventListQuery {
  section?: string | null;
  cityId?: number | null;
  category?: string | null;
  q?: string | null;
  limit?: number;
}

/** AVAILABLE, SELECTED (held by this browser), LOCKED (held by someone else), SOLD, B2B_RESERVED, DISABLED. */
export type SeatStatus = "AVAILABLE" | "SELECTED" | "LOCKED" | "SOLD" | "B2B_RESERVED" | "DISABLED";

export interface Seat {
  id: number;
  section_id: number;
  row_index: number;
  row_label: string;
  seat_number: number;
  x: number;
  y: number;
  tier_code?: string | null;
  status: SeatStatus;
}

export interface SeatTier {
  code: string;
  name: string;
  color: string;
  price: number | null;
}

export interface HallSection {
  id: number;
  name: string;
  tier_code?: string | null;
  tier_name?: string | null;
  tier_color?: string | null;
}

export interface SeatHold {
  seat_ids: number[];
  expires_at: string | null;
  seconds_left: number | null;
  hold_minutes: number;
  max_seats: number;
}

export interface SeatMapSession {
  id: number;
  event_id: number;
  event_title: string;
  event_subtitle?: string | null;
  event_slug: string;
  title?: string | null;
  banner_url?: string | null;
  start_time: string;
  end_time: string;
  price: number;
  capacity: number;
  hall_name: string;
  venue_name?: string | null;
  city_name: string;
  status: string;
  tiers: SeatTier[];
}

export interface SeatMapData {
  session: SeatMapSession;
  sections: HallSection[];
  seats: Seat[];
  hold: SeatHold | null;
}
