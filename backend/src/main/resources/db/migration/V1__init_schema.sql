-- Initial Database Schema for Youth Event Platform

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    title_fa VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    title_fa VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISABLED
    user_type VARCHAR(20) NOT NULL DEFAULT 'USER', -- ADMIN, USER
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otps (
    id BIGSERIAL PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL,
    code VARCHAR(10) NOT NULL,
    domain VARCHAR(20) NOT NULL, -- ADMIN, USER
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    province VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS halls (
    id BIGSERIAL PRIMARY KEY,
    city_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    capacity INT NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    category_id BIGINT,
    city_id BIGINT,
    hall_id BIGINT,
    description TEXT,
    banner_url VARCHAR(500),
    organizer_name VARCHAR(150),
    min_price DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, ARCHIVED
    featured BOOLEAN DEFAULT FALSE,
    popular BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    hall_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    capacity INT NOT NULL,
    reserved_seats INT DEFAULT 0,
    price DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, CANCELLED, COMPLETED
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    session_id BIGINT,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, PAID, CANCELLED, REFUNDED
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(100) NOT NULL UNIQUE,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    seat_label VARCHAR(50),
    price DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'VALID', -- VALID, USED, CANCELLED
    qr_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- SEED DATA
INSERT INTO roles (name, title_fa, description)
SELECT 'SUPER_ADMIN', 'مدیر ارشد', 'دسترسی کامل به تمامی بخش‌های سامانه' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SUPER_ADMIN');
INSERT INTO roles (name, title_fa, description)
SELECT 'EVENT_MANAGER', 'مدیر رویداد', 'مدیریت رویدادها، سانس‌ها و سالن‌ها' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'EVENT_MANAGER');
INSERT INTO roles (name, title_fa, description)
SELECT 'FINANCE_MANAGER', 'مدیر مالی', 'مدیریت گزارش‌های مالی و تسویه‌ها' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'FINANCE_MANAGER');

INSERT INTO permissions (code, title_fa)
SELECT 'EVENT_VIEW', 'مشاهده رویدادها' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'EVENT_VIEW');
INSERT INTO permissions (code, title_fa)
SELECT 'EVENT_CREATE', 'ایجاد رویداد' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'EVENT_CREATE');
INSERT INTO permissions (code, title_fa)
SELECT 'EVENT_UPDATE', 'ویرایش رویداد' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'EVENT_UPDATE');
INSERT INTO permissions (code, title_fa)
SELECT 'ORDER_VIEW', 'مشاهده سفارشات' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'ORDER_VIEW');
INSERT INTO permissions (code, title_fa)
SELECT 'FINANCE_VIEW', 'مشاهده گزارش‌های مالی' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'FINANCE_VIEW');
INSERT INTO permissions (code, title_fa)
SELECT 'USER_MANAGE', 'مدیریت کاربران' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'USER_MANAGE');

-- Default Admin Account (mobile: 09123456789)
INSERT INTO users (mobile, full_name, email, status, user_type)
SELECT '09123456789', 'مدیر ارشد سامانه', 'admin@youthevent.ir', 'ACTIVE', 'ADMIN' WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '09123456789');
INSERT INTO users (mobile, full_name, email, status, user_type)
SELECT '09120000000', 'کاربر نمونه آزمایشی', 'user@youthevent.ir', 'ACTIVE', 'USER' WHERE NOT EXISTS (SELECT 1 FROM users WHERE mobile = '09120000000');

INSERT INTO user_roles (user_id, role_id)
SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 1 AND role_id = 1);

INSERT INTO cities (name, province, active)
SELECT 'تهران', 'تهران', TRUE WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'تهران');
INSERT INTO cities (name, province, active)
SELECT 'اصفهان', 'اصفهان', TRUE WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'اصفهان');
INSERT INTO cities (name, province, active)
SELECT 'شیراز', 'فارس', TRUE WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'شیراز');
INSERT INTO cities (name, province, active)
SELECT 'مشهد', 'خراسان رضوی', TRUE WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'مشهد');
INSERT INTO cities (name, province, active)
SELECT 'تبریز', 'آذربایجان شرقی', TRUE WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'تبریز');

INSERT INTO halls (city_id, name, address, capacity, active)
SELECT 1, 'سالن همایش‌های برج میلاد', 'تهران، بزرگراه همت غرب، برج میلاد', 1600, TRUE WHERE NOT EXISTS (SELECT 1 FROM halls WHERE city_id = 1 AND name = 'سالن همایش‌های برج میلاد');
INSERT INTO halls (city_id, name, address, capacity, active)
SELECT 1, 'تالار وحدت', 'تهران، خیابان انقلاب، خیابان استاد شهریار', 750, TRUE WHERE NOT EXISTS (SELECT 1 FROM halls WHERE city_id = 1 AND name = 'تالار وحدت');
INSERT INTO halls (city_id, name, address, capacity, active)
SELECT 2, 'سیتی سنتر اصفهان', 'اصفهان، بزرگراه شهید دستجردی', 1000, TRUE WHERE NOT EXISTS (SELECT 1 FROM halls WHERE city_id = 2 AND name = 'سیتی سنتر اصفهان');

INSERT INTO categories (name, slug, icon)
SELECT 'کودک', 'child', 'Baby' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'child');
INSERT INTO categories (name, slug, icon)
SELECT 'خانواده', 'family', 'Users' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'family');
INSERT INTO categories (name, slug, icon)
SELECT 'سیرک', 'circus', 'Sparkles' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'circus');
INSERT INTO categories (name, slug, icon)
SELECT 'کنسرت', 'concert', 'Music' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'concert');
INSERT INTO categories (name, slug, icon)
SELECT 'شهروندی', 'citizenship', 'Building' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'citizenship');
INSERT INTO categories (name, slug, icon)
SELECT 'تکنولوژی', 'technology', 'Cpu' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'technology');
INSERT INTO categories (name, slug, icon)
SELECT 'هوش مصنوعی', 'ai', 'Bot' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'ai');

INSERT INTO events (title, slug, category_id, city_id, hall_id, description, banner_url, organizer_name, min_price, status, featured, popular)
SELECT 'سیرک بزرگ بین‌المللی تهران', 'circus-tehran', 3, 1, 1, 'هیجان‌انگیزترین نمایش سیرک سال با حضور هنرمندان بین‌المللی', '/images/events/circus.jpg', 'گروه فرهنگی هنری آفتاب', 150000, 'PUBLISHED', TRUE, TRUE WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'circus-tehran');

INSERT INTO events (title, slug, category_id, city_id, hall_id, description, banner_url, organizer_name, min_price, status, featured, popular)
SELECT 'جنگ خنده و شادی کودک و نوجوان', 'kids-laugh-show', 1, 1, 2, 'برنامه‌ای شاد و آموزنده ویژه کودکان و خانواده‌ها', '/images/events/kids.jpg', 'موسسه کودک شاد', 100000, 'PUBLISHED', TRUE, FALSE WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'kids-laugh-show');

INSERT INTO events (title, slug, category_id, city_id, hall_id, description, banner_url, organizer_name, min_price, status, featured, popular)
SELECT 'همایش ملی هوش مصنوعی و آینده جوانان', 'ai-youth-conference', 7, 1, 1, 'بررسی فرصت‌های شغلی و تکنولوژی‌های جدید در حوزه هوش مصنوعی', '/images/events/ai.jpg', 'آکادمی هوش مصنوعی ایران', 200000, 'PUBLISHED', FALSE, TRUE WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'ai-youth-conference');

INSERT INTO events (title, slug, category_id, city_id, hall_id, description, banner_url, organizer_name, min_price, status, featured, popular)
SELECT 'کنسرت بزرگ موسیقی سنتی ایرانی', 'iranian-concert', 4, 2, 3, 'اجرای زنده قطعات ماندگار موسیقی اصیل ایرانی', '/images/events/concert.jpg', 'گروه نوا', 250000, 'PUBLISHED', TRUE, TRUE WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'iranian-concert');

INSERT INTO sessions (event_id, hall_id, start_time, end_time, capacity, reserved_seats, price, status)
SELECT 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1600, 420, 150000, 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE event_id = 1 AND hall_id = 1 AND price = 150000);

INSERT INTO sessions (event_id, hall_id, start_time, end_time, capacity, reserved_seats, price, status)
SELECT 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1600, 890, 150000, 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE event_id = 1 AND capacity = 1600 AND reserved_seats = 890);

INSERT INTO sessions (event_id, hall_id, start_time, end_time, capacity, reserved_seats, price, status)
SELECT 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 750, 310, 100000, 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE event_id = 2 AND hall_id = 2);

INSERT INTO sessions (event_id, hall_id, start_time, end_time, capacity, reserved_seats, price, status)
SELECT 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1600, 1200, 200000, 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE event_id = 3 AND hall_id = 1);

INSERT INTO orders (order_number, user_id, session_id, total_amount, status, payment_method)
SELECT 'ORD-100201', 2, 1, 300000, 'PAID', 'ONLINE' WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-100201');

INSERT INTO orders (order_number, user_id, session_id, total_amount, status, payment_method)
SELECT 'ORD-100202', 2, 3, 100000, 'PAID', 'ONLINE' WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-100202');

INSERT INTO tickets (ticket_code, order_id, user_id, session_id, seat_label, price, status)
SELECT 'TCK-88901', 1, 2, 1, 'ردیف ۵ - صندلی ۱۲', 150000, 'VALID' WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_code = 'TCK-88901');

INSERT INTO tickets (ticket_code, order_id, user_id, session_id, seat_label, price, status)
SELECT 'TCK-88902', 1, 2, 1, 'ردیف ۵ - صندلی ۱۳', 150000, 'VALID' WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_code = 'TCK-88902');

INSERT INTO tickets (ticket_code, order_id, user_id, session_id, seat_label, price, status)
SELECT 'TCK-88903', 2, 2, 3, 'ردیف ۲ - صندلی ۴', 100000, 'VALID' WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_code = 'TCK-88903');
