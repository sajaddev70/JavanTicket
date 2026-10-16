/** Site content managed in the admin panel (GET /public/...). */

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
  /** Service fee in percent of the tickets after discount (0 = none). */
  service_fee_percent?: number | null;
}

/** Hero / banner text blocks keyed by block_key (HOME_HERO, EVENTS_HERO, SEAT_HERO, AUTH_HERO, CHECKOUT_NOTICE, ...). */
export interface PageBlock {
  block_key: string;
  kicker?: string | null;
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  image_url?: string | null;
}

export type PageBlocks = Record<string, PageBlock>;

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
  section?: "this-week" | "featured" | "popular" | "latest" | null;
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
  next_session_at?: string | null;
  hall_name?: string | null;
  city_name?: string | null;
  category_name?: string | null;
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
  image_url?: string | null;
  events_count: number;
}

export interface ContentPage {
  slug: string;
  title: string;
  content?: string | null;
  updated_at?: string | null;
}
