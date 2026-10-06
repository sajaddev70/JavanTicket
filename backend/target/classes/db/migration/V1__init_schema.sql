-- Initial Database Schema for Youth Event Platform

CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    title_fa VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    title_fa VARCHAR(100) NOT NULL
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISABLED
    user_type VARCHAR(20) NOT NULL DEFAULT 'USER', -- ADMIN, USER
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE otps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL,
    code VARCHAR(10) NOT NULL,
    domain VARCHAR(20) NOT NULL, -- ADMIN, USER
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    province VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE halls (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    capacity INT NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50)
);

CREATE TABLE events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
INSERT INTO roles (name, title_fa, description) VALUES
('SUPER_ADMIN', 'مدیر ارشد', 'دسترسی کامل به تمامی بخش‌های سامانه'),
('EVENT_MANAGER', 'مدیر رویداد', 'مدیریت رویدادها، سانس‌ها و سالن‌ها'),
('FINANCE_MANAGER', 'مدیر مالی', 'مدیریت گزارش‌های مالی و تسویه‌ها');

INSERT INTO permissions (code, title_fa) VALUES
('EVENT_VIEW', 'مشاهده رویدادها'),
('EVENT_CREATE', 'ایجاد رویداد'),
('EVENT_UPDATE', 'ویرایش رویداد'),
('ORDER_VIEW', 'مشاهده سفارشات'),
('FINANCE_VIEW', 'مشاهده گزارش‌های مالی'),
('USER_MANAGE', 'مدیریت کاربران');

-- Default Admin Account (mobile: 09123456789)
INSERT INTO users (mobile, full_name, email, status, user_type) VALUES
('09123456789', 'مدیر ارشد سامانه', 'admin@youthevent.ir', 'ACTIVE', 'ADMIN'),
('09120000000', 'کاربر نمونه آزمایشی', 'user@youthevent.ir', 'ACTIVE', 'USER');

INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

INSERT INTO cities (name, province, active) VALUES
('تهران', 'تهران', TRUE),
('اصفهان', 'اصفهان', TRUE),
('شیراز', 'فارس', TRUE),
('مشهد', 'خراسان رضوی', TRUE),
('تبریز', 'آذربایجان شرقی', TRUE);

INSERT INTO halls (city_id, name, address, capacity, active) VALUES
(1, 'سالن همایش‌های برج میلاد', 'تهران، بزرگراه همت غرب، برج میلاد', 1600, TRUE),
(1, 'تالار وحدت', 'تهران، خیابان انقلاب، خیابان استاد شهریار', 750, TRUE),
(2, 'سیتی سنتر اصفهان', 'اصفهان، بزرگراه شهید دستجردی', 1000, TRUE);

INSERT INTO categories (name, slug, icon) VALUES
('کودک', 'child', 'Baby'),
('خانواده', 'family', 'Users'),
('سیرک', 'circus', 'Sparkles'),
('کنسرت', 'concert', 'Music'),
('شهروندی', 'citizenship', 'Building'),
('تکنولوژی', 'technology', 'Cpu'),
('هوش مصنوعی', 'ai', 'Bot');

INSERT INTO events (title, slug, category_id, city_id, hall_id, description, banner_url, organizer_name, min_price, status, featured, popular) VALUES
('سیرک بزرگ بین‌المللی تهران', 'circus-tehran', 3, 1, 1, 'هیجان‌انگیزترین نمایش سیرک سال با حضور هنرمندان بین‌المللی', '/images/events/circus.jpg', 'گروه فرهنگی هنری آفتاب', 150000, 'PUBLISHED', TRUE, TRUE),
('جنگ خنده و شادی کودک و نوجوان', 'kids-laugh-show', 1, 1, 2, 'برنامه‌ای شاد و آموزنده ویژه کودکان و خانواده‌ها', '/images/events/kids.jpg', 'موسسه کودک شاد', 100000, 'PUBLISHED', TRUE, FALSE),
('همایش ملی هوش مصنوعی و آینده جوانان', 'ai-youth-conference', 7, 1, 1, 'بررسی فرصت‌های شغلی و تکنولوژی‌های جدید در حوزه هوش مصنوعی', '/images/events/ai.jpg', 'آکادمی هوش مصنوعی ایران', 200000, 'PUBLISHED', FALSE, TRUE),
('کنسرت بزرگ موسیقی سنتی ایرانی', 'iranian-concert', 4, 2, 3, 'اجرای زنده قطعات ماندگار موسیقی اصیل ایرانی', '/images/events/concert.jpg', 'گروه نوا', 250000, 'PUBLISHED', TRUE, TRUE);

INSERT INTO sessions (event_id, hall_id, start_time, end_time, capacity, reserved_seats, price, status) VALUES
(1, 1, DATEADD('DAY', 1, CURRENT_TIMESTAMP), DATEADD('HOUR', 2, CURRENT_TIMESTAMP), 1600, 420, 150000, 'ACTIVE'),
(1, 1, DATEADD('DAY', 2, CURRENT_TIMESTAMP), DATEADD('HOUR', 2, CURRENT_TIMESTAMP), 1600, 890, 150000, 'ACTIVE'),
(2, 2, DATEADD('DAY', 1, CURRENT_TIMESTAMP), DATEADD('HOUR', 2, CURRENT_TIMESTAMP), 750, 310, 100000, 'ACTIVE'),
(3, 1, DATEADD('DAY', 3, CURRENT_TIMESTAMP), DATEADD('HOUR', 3, CURRENT_TIMESTAMP), 1600, 1200, 200000, 'ACTIVE');

INSERT INTO orders (order_number, user_id, session_id, total_amount, status, payment_method) VALUES
('ORD-100201', 2, 1, 300000, 'PAID', 'ONLINE'),
('ORD-100202', 2, 3, 100000, 'PAID', 'ONLINE');

INSERT INTO tickets (ticket_code, order_id, user_id, session_id, seat_label, price, status) VALUES
('TCK-88901', 1, 2, 1, 'ردیف ۵ - صندلی ۱۲', 150000, 'VALID'),
('TCK-88902', 1, 2, 1, 'ردیف ۵ - صندلی ۱۳', 150000, 'VALID'),
('TCK-88903', 2, 2, 3, 'ردیف ۲ - صندلی ۴', 100000, 'VALID');
