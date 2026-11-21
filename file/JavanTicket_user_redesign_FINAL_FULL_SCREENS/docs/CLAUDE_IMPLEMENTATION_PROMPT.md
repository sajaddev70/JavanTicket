JavanTicket — User Android/PWA Redesign Implementation Task

SCOPE
Only implement/redesign the USER experience. Do not redesign the admin frontend.
Target:
- frontend/user (Next.js PWA)
- Android user application / Android wrapper/native surface where this project currently implements it

DESIGN SOURCE
Use this design package as the single visual reference:
file/JavanTicket_user_redesign_handoff_v1

Inside it:
- screens/ = the 10 approved mobile redesign references
- assets/brand/ = logos
- assets/icons/ = reusable SVG icons
- assets/images/ = event, venue and auth imagery
- assets/illustrations/ = OTP and payment-success illustrations
- assets/pwa/ = PWA icons
- assets/android/ = Android app icon assets
- docs/design-tokens.json = design system values

CRITICAL RULE
Do NOT use screenshots as page backgrounds.
Rebuild every screen with real React/Next.js components and the existing Android UI architecture.
Use assets from this package directly whenever an equivalent asset exists.

BACKEND FIRST
Before modifying UI:
1. Inspect the existing backend.
2. Inspect current frontend/user API integration.
3. Reuse all existing endpoints and models.
4. Do not create duplicate APIs.
5. If an endpoint truly does not exist, implement only the missing backend capability following the existing Spring Boot architecture.

NO STATIC PRODUCT DATA
All real data must remain dynamic from the server:
- events
- categories
- cities
- sessions
- halls
- prices
- available seats
- seat states
- order totals
- discount values
- payment methods
- users
- tickets
- QR/ticket payloads

The screenshots contain SAMPLE values only.

APPROVED VISUAL DIRECTION
Premium minimal ticketing UI:
- RTL Persian
- Vazirmatn
- white/off-white surfaces
- #0B2B5B navy
- #1268E8 primary action blue
- generous whitespace
- restrained borders/shadows
- strong event photography
- minimal gradients
- no dashboard-looking UI
- no rainbow UI
- clean mobile-first UX

IMPLEMENT THESE SCREENS EXACTLY IN THIS ORDER
01_home
02_events
03_event_detail
04_seat_selection
05_login
06_otp
07_checkout
08_payment
09_payment_success
10_ticket

ROUTE INTENT
Map them to the current project routes. Prefer existing routes and do not break route compatibility.
Expected logical routes:
/
 /events
 /events/[slug]
 /sessions/[sessionId]/seats
 /login
 /verify
 /checkout
 /payment
 /payment/result
 /tickets/[id]

BOTTOM NAVIGATION
Use exactly four primary destinations in the PWA mobile UX:
- خانه
- رویدادها
- بلیت‌های من
- پروفایل
Respect iOS/Android safe areas and PWA standalone mode.

HOME
Implement:
- compact app header
- city selector
- search
- premium hero
- horizontally scrollable categories
- featured events
- weekly recommendations
- Why Javan trust strip
- bottom navigation
Every event/card is API-driven.

EVENT LIST
Implement:
- header/search
- filters: category, city, date, sort
- mobile filter bottom sheet
- event grid/cards
- favorite interaction
- server pagination/infinite flow according to existing backend
Keep filter state in URL/search params where applicable.

EVENT DETAIL
Implement:
- hero image
- title/location/date
- quick info cards
- description
- session cards
- venue card
- important rules
- sticky mobile CTA
Session availability and prices come from backend.

SEAT SELECTION
Keep existing seat-lock/business logic.
Redesign UI to match 04_seat_selection.
Seat states:
AVAILABLE
SELECTED
SOLD
LOCKED
VIP
DISABLED
Seat selection must call backend lock APIs.
Countdown must be based on backend expiration, not only local state.
Implement zoom/pan only if supported/current architecture allows it without breaking behavior.

AUTH
Login by mobile.
OTP = 4 digits.
Keep existing backend verification.
Do not verify OTP locally.
Support paste, auto-next, backspace, resend countdown, edit mobile, validation/error states.

CHECKOUT
Dynamic:
- selected event/session
- selected seats
- buyer details
- discount code
- service fee
- final amount
- reservation timer
All price calculations must come from backend.
Frontend must not calculate authoritative totals.

PAYMENT
Payment methods must come from backend.
Keep current payment flow and redirects.
Never mark a payment successful in frontend without verified backend result.

PAYMENT RESULT
Render verified result from server:
- success/failure
- tracking code
- transaction id
- order id
- amount
- event/session/seats
- CTA to ticket

TICKET
Render backend ticket data and QR contract.
Never invent the QR payload.
Support download/share if existing APIs allow it.

ASSET MAPPING
Copy package assets into a clean structure such as:
frontend/user/public/assets/brand
frontend/user/public/assets/icons
frontend/user/public/assets/events
frontend/user/public/assets/illustrations
frontend/user/public/assets/pwa

Use SVG where possible.
Use next/image for raster assets.
Do not stretch images.
Preserve aspect ratios.

PWA
Verify/update:
- manifest
- 192x192 icon
- 512x512 icon
- maskable icon
- theme/background colors
- standalone mode
- safe-area-inset handling
Do not break current service worker/offline strategy.

ANDROID
Use provided Android app icon assets where compatible.
Do not replace existing native architecture unnecessarily.
Make Android user screens visually match the same design language and functional flow.
If Android is a wrapper around the PWA, prioritize one consistent responsive implementation rather than duplicating logic.

COMPONENTS
Create/reuse:
AppHeader
CitySelector
SearchField
MobileBottomNav
CategoryChip
EventCard
SectionHeader
SessionCard
SeatLegend
SeatSummarySheet
CheckoutSummary
PaymentMethodCard
OtpInput
TicketCard
LoadingSkeleton
EmptyState
ErrorState

STATES
Every API-driven screen needs:
loading
success
empty
error
retry
disabled/submitting
offline/reconnect where relevant

QUALITY
Do not stop at approximate layout.
Compare implementation side-by-side with screens in the design package and correct:
spacing
typography
radius
colors
image crop
card proportions
bottom-nav height
safe-area padding
button height
RTL alignment

RESPONSIVE
Although references are mobile/PWA, the Next.js user app must remain good at:
375
390
430
768
1024
1440
Desktop should be a calm expanded version of the same mobile-first design; do not revert to the old dashboard-like design.

DO NOT
- hardcode event/order/ticket data
- use screenshots as background
- duplicate backend endpoints
- break seat locks
- break auth
- break payment verification
- add unnecessary libraries
- redesign admin

VALIDATION
Before finishing:
- run frontend lint/typecheck/build
- run Android build/tests if Android sources were touched
- run backend tests/build if backend code was changed
- verify complete browser flow:
Home -> Events -> Detail -> Session -> Seat Lock -> Login/OTP -> Checkout -> Payment -> Verified Result -> Ticket

FINAL REPORT
Report:
- changed files
- implemented screens
- reused APIs
- any backend change
- asset paths
- PWA changes
- Android changes
- build/test results
- remaining known issues
