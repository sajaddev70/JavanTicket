import { apiGet, apiPost } from "./api";

export interface SiteSettings {
  site_name?: string | null;
  short_name?: string | null;
  tagline?: string | null;
  meta_description?: string | null;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
  footer_text?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  linkedin_url?: string | null;
  aparat_url?: string | null;
  newsletter_title?: string | null;
  newsletter_text?: string | null;
}

export interface PageBlock {
  block_key: string;
  kicker?: string | null;
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  image_url?: string | null;
}

export interface NavLink {
  id: number;
  title: string;
  url: string;
  open_in_new_tab?: boolean;
}

export interface Navigation {
  header: NavLink[];
  footer: { id: number; title: string; links: NavLink[] }[];
}

export interface Feature {
  id: number;
  title: string;
  description?: string | null;
  icon_url?: string | null;
}

export interface HomeSection {
  id: number;
  title: string;
  subtitle?: string | null;
  item_limit: number;
  section?: EventSection | null;
  category_slug?: string | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  button_text?: string | null;
  event_slug?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  next_session_at?: string | null;
  hall_name?: string | null;
  city_name?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  category_cover_url?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  tagline?: string | null;
  icon_url?: string | null;
  image_url?: string | null;
  cover_url?: string | null;
  color?: string | null;
  events_count: number;
}

export interface City {
  id: number;
  name: string;
  province: string;
}

export interface PublicEvent {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  banner_url?: string | null;
  organizer_name?: string | null;
  min_price?: number | null;
  featured: boolean;
  popular: boolean;
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
  subtitle?: string | null;
  notice?: string | null;
  website_url?: string | null;
  status?: string;
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
  status: string;
  hall_name: string;
  city_name: string;
  has_seat_map: boolean;
}

export interface EventDetail extends PublicEvent {
  sessions: EventSession[];
  first_start?: string | null;
  last_end?: string | null;
  stats: { value: string; label: string; icon_url?: string | null; color?: string | null }[];
  topics: { title: string; icon_url?: string | null; color?: string | null }[];
  speakers: { full_name: string; job_title?: string | null; organization?: string | null; photo_url?: string | null; keynote: boolean }[];
  gallery: { image_url: string; caption?: string | null }[];
  faqs: { question: string; answer: string }[];
}

export interface EventPage {
  items: PublicEvent[];
  total: number;
  page: number;
  size: number;
}

export interface SeatTierPrice {
  code: string;
  name: string;
  color: string;
  price: number | null;
}

export interface SessionSeatMap {
  session: {
    id: number;
    event_title: string;
    event_slug: string;
    title?: string | null;
    banner_url?: string | null;
    start_time: string;
    end_time: string;
    price: number;
    hall_name: string;
    venue_name?: string | null;
    city_name: string;
    status: string;
    tiers: SeatTierPrice[];
  };
  seats: {
    id: number;
    section_id: number;
    row_index: number;
    row_label: string;
    seat_number: number;
    x: number;
    y: number;
    tier_code?: string | null;
    status: string;
  }[];
}

export interface ContentPage {
  slug: string;
  title: string;
  content?: string | null;
  updated_at?: string | null;
}

export type EventSection = "this-week" | "featured" | "popular" | "latest";

export interface EventQuery {
  section?: EventSection | null;
  cityId?: number | null;
  category?: string | null;
  q?: string | null;
  limit?: number;
}

export interface EventSearch {
  q?: string | null;
  cityId?: number | null;
  category?: string | null;
  when?: string | null;
  section?: string | null;
  sort?: string;
  page?: number;
  size?: number;
}

export const publicApi = {
  pageBlocks: () => apiGet<Record<string, PageBlock>>("/public/page-blocks"),
  searchEvents: ({ cityId, ...rest }: EventSearch) =>
    apiGet<EventPage>("/public/events/search", { ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null && v !== "")), cityId: cityId ?? undefined }),
  seatMap: (sessionId: number) => apiGet<SessionSeatMap>(`/public/sessions/${sessionId}/seat-map`),
  validateDiscount: (code: string, amount: number) => apiPost<{ code: string; discount: number; total: number }>("/public/discounts/validate", { code, amount }),
  siteSettings: () => apiGet<SiteSettings>("/public/site-settings"),
  navigation: () => apiGet<Navigation>("/public/navigation"),
  features: () => apiGet<Feature[]>("/public/features"),
  homeSections: () => apiGet<HomeSection[]>("/public/home-sections"),
  banners: () => apiGet<Banner[]>("/public/banners"),
  categories: () => apiGet<Category[]>("/public/categories"),
  cities: () => apiGet<City[]>("/public/cities"),
  events: ({ cityId, section, category, q, limit }: EventQuery) =>
    apiGet<PublicEvent[]>("/public/events", {
      section: section || undefined,
      category: category || undefined,
      q: q || undefined,
      cityId: cityId ?? undefined,
      limit,
    }),
  event: (slug: string) => apiGet<EventDetail>(`/public/events/${encodeURIComponent(slug)}`),
  page: (slug: string) => apiGet<ContentPage>(`/public/pages/${encodeURIComponent(slug)}`),
  subscribe: (email: string) => apiPost<void>("/public/newsletter", { email }),
};
