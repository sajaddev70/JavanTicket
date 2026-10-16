# API Contract — User Site (frontend/user)

Every endpoint the user site calls. Base URL: `NEXT_PUBLIC_API_URL` (browser) / `API_INTERNAL_URL` (server rendering),
e.g. `http://localhost:8081/api/v1`.

## Conventions

- **Envelope**: every JSON answer is `{ "success": boolean, "message"?: string, "data"?: T, "errors"?: {field: message}, "timestamp": string }`.
  The service layer (`src/services/api.ts`) unwraps `data`; errors become an `ApiError` carrying the backend's Persian `message`.
- **Field names** are `snake_case` (rows come straight from SQL). Dates are ISO-8601 instants (`2026-10-22T14:30:00Z`); amounts are in **Toman**.
- **Auth**: `Authorization: Bearer <accessToken>` from `/auth/user/verify` (JWT, 24h). Every `/user/**` endpoint requires it (401 otherwise).
  The `refreshToken` (JWT, 7 days, `type=refresh`) only works with `/auth/user/refresh`; it is refused as an access token.
- **Seat locks**: `X-Hold-Token: <random id>` identifies this browser's seat selection (`src/stores/holdToken.ts`).
- **Paged lists** answer `{ items, total, page, size }` (`page` starts at 1).
- **Errors**: 400 validation / business rule, 401 session expired, 404 not found, 409 conflict (seat taken, hold expired), 503 SMS/gateway unavailable.

---

## Content (admin-managed)

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| GET | `/public/site-settings` | – | `{ site_name, short_name, tagline, meta_description, logo_url, logo_dark_url, contact_phone, contact_email, address, instagram_url, telegram_url, linkedin_url, aparat_url, newsletter_title, newsletter_text, footer_text, service_fee_percent }` | Header, footer, metadata, manifest, login terms, seat cart fee preview |
| GET | `/public/navigation` | – | `{ header: Link[], footer: { id, title, links: Link[] }[] }`, `Link = { id, title, url, open_in_new_tab }` | Header menu, mobile drawer, footer columns |
| GET | `/public/page-blocks` | – | `{ [block_key]: { block_key, kicker, title, subtitle, button_text, button_url, image_url } }` — keys used: `HOME_HERO`, `EVENTS_HERO`, `SEAT_HERO`, `AUTH_HERO`, `CHECKOUT_NOTICE`, `PAYMENT_NOTICE`, `TICKET_GUIDE` | Home hero slide, events header, seat page title, login/OTP hero, checkout notes, payment notice, ticket entry guide |
| GET | `/public/features` | – | `{ id, title, description, icon_url }[]` | Login / OTP feature tiles |
| GET | `/public/home-sections` | – | `{ id, title, subtitle, item_limit, section: "featured"\|"this-week"\|"popular"\|"latest"\|null, category_slug }[]` | Homepage event rows |
| GET | `/public/banners` | – | `{ id, title, subtitle, image_url, link_url, button_text, event_slug, category_name, city_name, category_cover_url, ... }[]` | Homepage hero slider |
| GET | `/public/categories` | – | `{ id, name, slug, tagline, icon_url, image_url, cover_url, color, events_count }[]` | Homepage categories, events page category tabs |
| GET | `/public/cities` | – | `{ id, name, province, image_url, events_count }[]` | Header city selector, events city filter, "events by city", profile city |
| GET | `/public/pages/{slug}` | – | `{ slug, title, content, updated_at }` (404 when missing) | `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/buy-guide`, … |
| POST | `/public/newsletter` | `{ email }` | – | Footer newsletter |

## Events

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| GET | `/public/events` | `section?`, `category?`, `q?`, `cityId?`, `limit?` | `Event[]` | Homepage rows, payment result suggestions |
| GET | `/public/events/search` | `q?`, `cityId?`, `category?`, `when?` (`today`\|`week`\|`month`), `section?` (`featured`\|`popular`), `minPrice?`, `maxPrice?`, `sort` (`newest`\|`soonest`\|`price`), `page`, `size` (≤48) | `{ items: Event[], total, page, size }` | `/events` (server-side filters and paging) |
| GET | `/public/events/{slug}` | – | `Event + { first_start, last_end, sold_count, sessions: Session[], stats[], topics[], speakers[], gallery[], faqs[] }` (404 when missing) | `/events/[slug]` (SSR + `generateMetadata` + JSON-LD) |

`Event = { id, title, slug, subtitle, description, notice, banner_url, organizer_name, website_url, min_price, featured, popular, status, start_date, end_date, next_session_at, category_name, category_slug, category_color, category_icon_url, category_cover_url, city_id, city_name, hall_name, venue_name, hall_address }`

`Session = { id, title, start_time, end_time, price, from_price, capacity, reserved_seats, available_seats, status ("ACTIVE"\|"SCHEDULED"), hall_name, city_name, has_seat_map }`

## Seat map and seat locks

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| GET | `/public/sessions/{id}/seat-map` | header `X-Hold-Token` | `{ session: { id, event_id, event_title, event_slug, banner_url, start_time, end_time, price, capacity, hall_name, venue_name, city_name, status, tiers: { code, name, color, price }[] }, sections: { id, name, tier_code, tier_name, tier_color }[], seats: { id, section_id, row_index, row_label, seat_number, x, y, tier_code, status }[], hold: Hold }` | `/sessions/[id]/seats` (refreshed every 15 s) |
| GET | `/public/sessions/{id}/holds` | header `X-Hold-Token` | `Hold` | – (hold summary also comes with the seat map) |
| POST | `/public/sessions/{id}/holds` | header `X-Hold-Token`, `{ seat_id }` | `Hold`; **409** `این صندلی در حال حاضر توسط کاربر دیگری انتخاب شده است.` | Seat click (lock) |
| DELETE | `/public/sessions/{id}/holds/{seatId}` | header `X-Hold-Token` | `Hold` | Seat click on a selected seat / remove from cart |
| DELETE | `/public/sessions/{id}/holds` | header `X-Hold-Token` | `Hold` | "لغو انتخاب همه صندلی‌ها" |

Seat `status`: `AVAILABLE`, `SELECTED` (held by this X-Hold-Token), `LOCKED` (held by another buyer), `SOLD`, `B2B_RESERVED` (group / organization / guest), `DISABLED`.

`Hold = { seat_ids: number[], expires_at: string|null, seconds_left: number|null, hold_minutes: 10, max_seats: 10 }` — all seats of a selection share one deadline,
10 minutes after the first pick; the countdown uses `seconds_left` (server clock).

## Authentication (user OTP — separate from the admin OTP)

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| POST | `/auth/user/login` | `{ mobile: "09xxxxxxxxx" }` | – (user is created on first login) | `/login`, resend on `/verify` |
| POST | `/auth/user/verify` | `{ mobile, code: "dddd" }` | `{ accessToken, refreshToken, user: { id, mobile, fullName, email, userType, roles, permissions } }` | `/verify` |
| POST | `/auth/user/refresh` | `{ refreshToken }` | same as verify (new access + refresh token); 401 when the refresh token is invalid / expired | `services/api.ts` — on a 401 the request is replayed once after a shared refresh; a failed refresh signs out |

The backend generates and checks the code. With a Kavenegar API key the code is random and sent by SMS; without one (development) the
fixed dev code (`sms.dev-code`, default `1111`) is accepted and only logged.

## Checkout (orders)

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| POST | `/user/orders` | `{ session_id, hold_token }` (seat map) or `{ session_id, quantity }` (general admission), `discount_code?` | `{ order_number }`; 409 when the hold expired | `/checkout?session=…` |
| GET | `/user/orders/{number}` | – | `Order` | `/checkout`, `/payment`, `/orders/[number]` |
| PUT | `/user/orders/{number}/buyer` | `{ first_name, last_name, mobile, email?, note? }` | `Order` | `/checkout` "ادامه به پرداخت" |
| POST | `/user/orders/{number}/discount` | `{ code }` | `Order` (recalculated) | `/checkout` discount box |
| DELETE | `/user/orders/{number}/discount` | – | `Order` | `/checkout` remove discount |
| GET | `/user/orders` | `status?` (`PENDING`\|`PAID`\|`CANCELLED`\|`REFUNDED`), `page`, `size` | `{ items: OrderRow[], total, page, size }` | `/orders` |

`Order = { id, order_number, status, subtotal, discount_code, discount_amount, service_fee, total_amount, quantity, unit_price, created_at, paid_at, tracking_code, payment_method, buyer_first_name, buyer_last_name, buyer_mobile, buyer_email, buyer_note, user_mobile, user_first_name, user_last_name, user_email, session_id, start_time, end_time, event_title, event_subtitle, event_slug, banner_url, category_name, hall_name, venue_name, hall_address, city_name, expires_at, seconds_left, payable, seats: { id, row_label, seat_number, section_name, tier_code, tier_name, tier_color, price }[], tickets: { id, ticket_code, seat_label, price, status }[] }`

All amounts are computed by the backend; the frontend never calculates discounts or totals.
`total_amount = subtotal - discount_amount + service_fee`, where `service_fee` is `service_fee_percent` (site settings, set in the
admin panel) of the amount after discount, rounded to whole Toman. The seat page shows the same formula only as a preview.

## Payment

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| GET | `/user/payment-methods` | – | `{ code, title, description, logo_url }[]` (enabled gateways) | `/payment` |
| POST | `/user/orders/{number}/payments` | `{ gateway }` | `{ payment_id, redirect_url }` — the browser is sent to `redirect_url` | `/payment` "اتصال به درگاه پرداخت" |
| GET/POST | `/payments/callback/{gateway}` | gateway fields (`authority`, `status`, …) | **302** to `{USER_SITE_URL}/payment/result?id={payment_id}` after verification | Bank → backend (not called by the frontend) |
| GET | `/user/payments/{id}` | – | `{ id, status ("INITIATED"\|"SUCCESS"\|"FAILED"), gateway, gateway_title, amount, reference_id, tracking_code, card_pan, failure_reason, created_at, verified_at, order_number, order_status, order: Order }` | `/payment/result` |
| GET | `/payments/dev/{authority}` | – | HTML test bank page (only with `payment.mode=dev`, never with the `prod` profile) | Development gateway |

Flow: create order → buyer details → `POST payments` → redirect to gateway → gateway callback → backend verifies and issues tickets →
redirect to `/payment/result?id=` → frontend reads the verified result. The frontend never decides that a payment succeeded.

## Tickets

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| GET | `/user/tickets` | `scope` (`upcoming`\|`past`\|`cancelled`), `page`, `size` | `{ items: TicketRow[], total, page, size, counts: { upcoming, past, cancelled } }` | `/tickets` |
| POST | `/user/tickets/{id}/send-sms` | – | `{ mobile }`, message `بلیت به شماره … پیامک شد.`; 429 within a minute of the last send | `/tickets/[id]` "ارسال به موبایل" |
| GET | `/user/tickets/{id}` | – | `{ id, ticket_code, qr_code, seat_label, price, status, row_label, seat_number, section_name, tier_name, session_id, session_title, start_time, end_time, session_status, event_title, event_subtitle, event_slug, banner_url, category_name, category_color, category_icon_url, hall_name, venue_name, hall_address, city_name, order_number, order_status, ordered_at, paid_at, order_total, order_tickets_count, buyer_name, buyer_mobile }` | `/tickets/[id]` |

`qr_code` is a random 16-character value (80 bits) generated by the backend; the QR image is drawn from it as-is. The gate
(`POST /admin/gate/scan`) accepts either this value or the printed ticket code.

## Profile and favorites

| Method | URL | Request | Response (`data`) | Used by |
|---|---|---|---|---|
| GET | `/user/profile` | – | `{ id, mobile, first_name, last_name, full_name, email, city_id, city_name, avatar_url, created_at, orders_count, upcoming_tickets_count, favorites_count }` | `/profile`, header name sync |
| PUT | `/user/profile` | `{ first_name, last_name, email?, city_id? }` | profile | `/profile` |
| GET | `/user/favorites` | – | `Event[]` | `/favorites` |
| GET | `/user/favorites/ids` | – | `number[]` | Heart state on every event card |
| PUT | `/user/favorites/{eventId}` | – | – | Heart (add) |
| DELETE | `/user/favorites/{eventId}` | – | – | Heart (remove) |
