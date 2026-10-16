-- Migration V5: schema for the redesigned admin screens (events, rotation calendar, cities, halls, seat maps,
-- sessions) and user screens (home, events, event detail, seat selection). Sample data is loaded by DemoDataSeeder.

-- ---------- Cities ----------
ALTER TABLE cities ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE cities ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100);
ALTER TABLE cities ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'; -- ACTIVE, PLANNED, INACTIVE
ALTER TABLE cities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
UPDATE cities SET status = CASE WHEN active THEN 'ACTIVE' ELSE 'INACTIVE' END;
-- active (used by the site and dashboard) = status <> 'INACTIVE'; PLANNED cities are already shown.

-- ---------- Halls ----------
ALTER TABLE halls ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE halls ADD COLUMN IF NOT EXISTS venue_name VARCHAR(150);
ALTER TABLE halls ADD COLUMN IF NOT EXISTS hall_type VARCHAR(20) NOT NULL DEFAULT 'CONFERENCE'; -- CONFERENCE, EXHIBITION, CONCERT, EDUCATION, THEATER
ALTER TABLE halls ADD COLUMN IF NOT EXISTS gates_count INT NOT NULL DEFAULT 1;
ALTER TABLE halls ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'; -- ACTIVE, INACTIVE, EQUIPPING, UNDER_CONSTRUCTION
ALTER TABLE halls ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
UPDATE halls SET status = CASE WHEN active THEN 'ACTIVE' ELSE 'INACTIVE' END;

-- ---------- Categories ----------
-- Line icon (SVG) used on the user site category tiles and tabs
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500);

-- ---------- Events: detail page content ----------
ALTER TABLE events ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
-- Highlighted note on the event page (e.g. limited capacity)
ALTER TABLE events ADD COLUMN IF NOT EXISTS notice TEXT;
-- Status now also allows CANCELLED: DRAFT, PUBLISHED, CANCELLED, ARCHIVED

CREATE TABLE IF NOT EXISTS event_stats (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    value VARCHAR(30) NOT NULL,
    label VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    color VARCHAR(20),
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_topics (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    icon_url VARCHAR(500),
    color VARCHAR(20),
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_speakers (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(150),
    organization VARCHAR(150),
    photo_url VARCHAR(500),
    keynote BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_gallery (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_faqs (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    question VARCHAR(300) NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- ---------- Sessions ----------
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS title VARCHAR(200); -- optional name, e.g. a workshop inside an expo
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- Status now also allows SCHEDULED (announced, sales not open): SCHEDULED, ACTIVE, CANCELLED, COMPLETED

-- ---------- Seat maps ----------
CREATE TABLE IF NOT EXISTS seat_tiers (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    sort_order INT DEFAULT 0
);

-- A block of seats in a hall; seats are generated from rows x seats_per_row at (pos_x, pos_y). `curve` lifts the
-- outer seats of each row towards the stage, measured across the whole hall, so all sections share one arc.
INSERT INTO seat_tiers (code, name, color, sort_order) VALUES
('VIP', 'VIP', '#22C55E', 1),
('GOLD', 'طلایی', '#2F6FEB', 2),
('SILVER', 'نقره‌ای', '#F5A524', 3),
('NORMAL', 'معمولی', '#93C5FD', 4)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS hall_sections (
    id BIGSERIAL PRIMARY KEY,
    hall_id BIGINT NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    first_row INT NOT NULL DEFAULT 1,
    rows_count INT NOT NULL,
    seats_per_row INT NOT NULL,
    pos_x NUMERIC(8,2) NOT NULL DEFAULT 0,
    pos_y NUMERIC(8,2) NOT NULL DEFAULT 0,
    curve NUMERIC(6,2) NOT NULL DEFAULT 0,
    tier_code VARCHAR(20) REFERENCES seat_tiers(code),
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS seats (
    id BIGSERIAL PRIMARY KEY,
    hall_id BIGINT NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    section_id BIGINT NOT NULL REFERENCES hall_sections(id) ON DELETE CASCADE,
    row_index INT NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    x NUMERIC(8,2) NOT NULL,
    y NUMERIC(8,2) NOT NULL,
    tier_code VARCHAR(20) REFERENCES seat_tiers(code),
    disabled BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_seats_hall ON seats(hall_id);

CREATE TABLE IF NOT EXISTS session_prices (
    session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    tier_code VARCHAR(20) NOT NULL REFERENCES seat_tiers(code),
    price DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (session_id, tier_code)
);

-- Seats that are not free for a session. No row = available.
CREATE TABLE IF NOT EXISTS seat_reservations (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- SOLD, HELD (in checkout), BLOCKED (guests/sponsors), GROUP (group reservation)
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    held_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (session_id, seat_id)
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat_id BIGINT REFERENCES seats(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- ---------- Discount codes ----------
CREATE TABLE IF NOT EXISTS discount_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150),
    discount_type VARCHAR(10) NOT NULL DEFAULT 'PERCENT', -- PERCENT, AMOUNT
    value DECIMAL(12,2) NOT NULL,
    max_uses INT,
    used_count INT NOT NULL DEFAULT 0,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Page blocks (heroes, call-to-action banners) ----------
CREATE TABLE IF NOT EXISTS page_blocks (
    id BIGSERIAL PRIMARY KEY,
    block_key VARCHAR(40) NOT NULL UNIQUE, -- HOME_HERO, HOME_CTA, EVENTS_HERO, SEAT_HERO
    kicker VARCHAR(150),
    title VARCHAR(200),
    subtitle VARCHAR(500),
    button_text VARCHAR(100),
    button_url VARCHAR(500),
    image_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE
);

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS aparat_url VARCHAR(255);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS newsletter_title VARCHAR(150);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS newsletter_text VARCHAR(255);

-- ---------- Admin menu: new screens and the SVG icon set ----------
UPDATE admin_menu_items SET implemented = TRUE WHERE item_key IN ('rotationCalendar', 'seatMaps', 'sessions', 'discounts');

INSERT INTO admin_menu_items (item_key, title, description, path, icon, section_id, section_order, sidebar_group, sidebar_order, implemented)
SELECT 'pageBlocks', 'سربرگ‌ها و بنرهای صفحات', 'سربرگ صفحه اصلی، صفحه رویدادها و بنر دعوت به خرید', '/page-blocks', 'LayoutList', s.id, 7, 2, 7, TRUE
FROM admin_menu_sections s WHERE s.title = 'محتوای سایت'
ON CONFLICT (item_key) DO NOTHING;

UPDATE admin_menu_items SET icon = '/media/icons/admin/' || v.svg || '.svg'
FROM (VALUES
    ('dashboard', 'dashboard'), ('events', 'events'), ('rotationCalendar', 'rotation-calendar'), ('cities', 'cities'),
    ('halls', 'halls'), ('seatMaps', 'seat-map'), ('sessions', 'sessions'), ('orders', 'orders'),
    ('organizations', 'organizations'), ('groupReservations', 'group-reservations'), ('invoices', 'invoice'),
    ('discounts', 'discount'), ('gateControl', 'gate'), ('finance', 'finance'), ('settlements', 'settlements'),
    ('crm', 'crm'), ('reports', 'reports'), ('users', 'admins'), ('roles', 'roles'), ('notifications', 'messages'),
    ('settings', 'settings'), ('activityLogs', 'audit-log')
) AS v(item_key, svg)
WHERE admin_menu_items.item_key = v.item_key;

-- Order of the design: events, calendar, cities, halls, seat maps, sessions
UPDATE admin_menu_items SET sidebar_order = v.o
FROM (VALUES ('dashboard', 1), ('events', 2), ('rotationCalendar', 3), ('cities', 4), ('halls', 5), ('seatMaps', 6), ('sessions', 7), ('categories', 8)) AS v(k, o)
WHERE item_key = v.k;

CREATE INDEX IF NOT EXISTS idx_seat_reservations_session ON seat_reservations(session_id);

-- Key/value markers, e.g. which version of the local demo data has been loaded
CREATE TABLE IF NOT EXISTS app_meta (
    meta_key VARCHAR(100) PRIMARY KEY,
    meta_value VARCHAR(500)
);

-- The homepage hero is now a page block; the old banner slider is no longer part of the design.
UPDATE admin_menu_items SET active = FALSE WHERE item_key = 'banners';
