-- Migration V9: user site checkout flow — seat locks before checkout, buyer details, payments through a gateway,
-- favorites, profile fields and an unguessable QR payload per ticket.

-- ---------- Seat locks ----------
-- A seat picked on the seat map is held (status HELD) for the browser that picked it, identified by a random hold
-- token, until held_until. At checkout the held seats are attached to the order (order_id) and keep the same deadline.
ALTER TABLE seat_reservations ADD COLUMN IF NOT EXISTS hold_token VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_hold_token ON seat_reservations(hold_token) WHERE hold_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seat_reservations_order ON seat_reservations(order_id) WHERE order_id IS NOT NULL;

-- ---------- Profile ----------
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city_id BIGINT REFERENCES cities(id) ON DELETE SET NULL;

-- ---------- Buyer details on the order ----------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_first_name VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_last_name VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_mobile VARCHAR(15);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(150);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_note VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- ---------- Payments ----------
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'INITIATED', -- INITIATED, SUCCESS, FAILED
    -- Reference the gateway issues for the payment request (token / authority / RefId)
    authority VARCHAR(100) NOT NULL UNIQUE,
    -- Bank reference of a completed payment (RRN / RefID) and the tracking code shown to the buyer
    reference_id VARCHAR(100),
    tracking_code VARCHAR(50),
    card_pan VARCHAR(30),
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ---------- Favorites ----------
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, event_id)
);

-- ---------- Ticket QR payload ----------
-- ticket_code is readable and sequential; the QR carries qr_code, a random value that cannot be derived from it.
-- Tickets created from now on get one from the backend (SecureRandom); existing ones are backfilled here.
UPDATE tickets SET qr_code = UPPER(SUBSTRING(md5(random()::text || clock_timestamp()::text || id::text) FROM 1 FOR 16))
WHERE qr_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code) WHERE qr_code IS NOT NULL;

-- ---------- Content blocks of the new user screens (editable in "سربرگ‌ها و بنرهای صفحات") ----------
-- subtitle holds one item per line; "عنوان: توضیح" lines are shown as a title with a description.
INSERT INTO page_blocks (block_key, kicker, title, subtitle, image_url, active) VALUES
('AUTH_HERO', NULL, 'به دنیای رویدادهای خاطره‌انگیز خوش آمدید',
 'با یک حساب کاربری، به جدیدترین کنسرت‌ها، نمایش‌ها و جشنواره‌ها دسترسی داشته باشید و به‌راحتی بلیت خود را تهیه کنید.',
 '/media/heroes/home-hero.jpg', TRUE),
('CHECKOUT_NOTICE', NULL, 'نکات مهم خرید',
 E'بلیت‌ها پس از تکمیل پرداخت، به صورت الکترونیکی صادر می‌شوند.\nامکان استرداد بلیت مطابق با قوانین هر رویداد وجود دارد.\nلطفاً اطلاعات خود را با دقت وارد کنید.\nدر صورت بروز هرگونه مشکل با پشتیبانی تماس بگیرید.',
 NULL, TRUE),
('PAYMENT_NOTICE', NULL, 'پرداخت امن و مطمئن',
 'کلیه اطلاعات پرداخت شما به صورت رمزنگاری‌شده از طریق درگاه‌های رسمی بانکی و تحت نظارت شاپرک انجام می‌شود و اطلاعات کارت شما ذخیره نمی‌شود.',
 NULL, TRUE),
('TICKET_GUIDE', NULL, 'راهنمای ورود به سالن',
 E'همراه داشتن بلیت: این بلیت الکترونیک را به صورت چاپی یا روی موبایل خود همراه داشته باشید.\nاسکن QR Code: در ورودی سالن، کد QR بلیت خود را به اسکنر نشان دهید.\nحضور به‌موقع: لطفاً حداقل ۳۰ دقیقه قبل از شروع برنامه در محل حضور داشته باشید.\nرعایت قوانین: از ورود وسایل غیرمجاز به سالن خودداری فرمایید.',
 NULL, TRUE)
ON CONFLICT (block_key) DO NOTHING;
