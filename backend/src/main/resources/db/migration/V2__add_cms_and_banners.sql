-- Migration V2: Add CMS, Banners, Site Settings, Regional Stats and System Alerts

CREATE TABLE IF NOT EXISTS banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    button_text VARCHAR(100),
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
    id BIGSERIAL PRIMARY KEY,
    site_name VARCHAR(150) NOT NULL DEFAULT 'مرکز همایش و نمایش جوان',
    logo_url VARCHAR(500),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    address TEXT,
    instagram_url VARCHAR(255),
    telegram_url VARCHAR(255),
    footer_text TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_stats (
    id BIGSERIAL PRIMARY KEY,
    province_name VARCHAR(100) NOT NULL UNIQUE,
    city_name VARCHAR(100) NOT NULL,
    sales_amount DECIMAL(14,2) DEFAULT 0,
    sales_amount_fa VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    position_top VARCHAR(20),
    position_left VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS system_alerts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, SUCCESS, DANGER
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Site Settings
INSERT INTO site_settings (site_name, logo_url, contact_phone, contact_email, address, footer_text)
SELECT 'مرکز همایش و نمایش جوان', '/javan-logo.svg', '021-88888888', 'info@youthevent.ir', 'تهران، بزرگراه همت غرب، برج میلاد، مرکز همایش‌ها', 'سامانه رسمی بلیت‌فروشی و مدیریت رویدادهای فرهنگی کشور - مرکز جوانان'
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE site_name = 'مرکز همایش و نمایش جوان');

-- Seed Hero Banners
INSERT INTO banners (title, subtitle, image_url, link_url, button_text, sort_order, active)
SELECT 'کنسرت بزرگ حمید هیراد', 'تهران - سالن همایش‌های بین‌المللی برج میلاد | ۱۰ و ۱۱ مهر ماه', '/hero-banner.jpg', '/events/hamid-hirad-concert', 'انتخاب سانس و خرید بلیت', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE title = 'کنسرت بزرگ حمید هیراد');

INSERT INTO banners (title, subtitle, image_url, link_url, button_text, sort_order, active)
SELECT 'سیرک بزرگ بین‌المللی ایران', 'مجموعه ورزشی انقلاب - اجراهای شاد خانوادگی', '/images/events/circus.jpg', '/events/circus-tehran', 'رزرو آنلاین صندلی', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE title = 'سیرک بزرگ بین‌المللی ایران');

INSERT INTO banners (title, subtitle, image_url, link_url, button_text, sort_order, active)
SELECT 'نمایش موزیکال و جنگ خنده کودک', 'تالار هنر تهران - ویژه کودکان و خانواده‌ها', '/images/events/kids.jpg', '/events/kids-musical-show', 'مشاهده جزئیات برنامه', 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM banners WHERE title = 'نمایش موزیکال و جنگ خنده کودک');

-- Seed Regional Stats
INSERT INTO regional_stats (province_name, city_name, sales_amount, sales_amount_fa, active, position_top, position_left)
SELECT 'تهران', 'تهران', 24500000, '۲۴.۵ میلیون', TRUE, '42%', '48%'
WHERE NOT EXISTS (SELECT 1 FROM regional_stats WHERE province_name = 'تهران');

INSERT INTO regional_stats (province_name, city_name, sales_amount, sales_amount_fa, active, position_top, position_left)
SELECT 'اصفهان', 'اصفهان', 8200000, '۸.۲ میلیون', TRUE, '55%', '45%'
WHERE NOT EXISTS (SELECT 1 FROM regional_stats WHERE province_name = 'اصفهان');

INSERT INTO regional_stats (province_name, city_name, sales_amount, sales_amount_fa, active, position_top, position_left)
SELECT 'خراسان رضوی', 'مشهد', 6100000, '۶.۱ میلیون', TRUE, '35%', '78%'
WHERE NOT EXISTS (SELECT 1 FROM regional_stats WHERE province_name = 'خراسان رضوی');

INSERT INTO regional_stats (province_name, city_name, sales_amount, sales_amount_fa, active, position_top, position_left)
SELECT 'فارس', 'شیراز', 4800000, '۴.۸ میلیون', TRUE, '70%', '42%'
WHERE NOT EXISTS (SELECT 1 FROM regional_stats WHERE province_name = 'فارس');

INSERT INTO regional_stats (province_name, city_name, sales_amount, sales_amount_fa, active, position_top, position_left)
SELECT 'آذربایجان شرقی', 'تبریز', 3200000, '۳.۲ میلیون', TRUE, '25%', '20%'
WHERE NOT EXISTS (SELECT 1 FROM regional_stats WHERE province_name = 'آذربایجان شرقی');

INSERT INTO regional_stats (province_name, city_name, sales_amount, sales_amount_fa, active, position_top, position_left)
SELECT 'خوزستان', 'اهواز', 1700000, '۱.۷ میلیون', TRUE, '65%', '28%'
WHERE NOT EXISTS (SELECT 1 FROM regional_stats WHERE province_name = 'خوزستان');

-- Seed System Alerts
INSERT INTO system_alerts (title, message, alert_type, active)
SELECT 'هشدار ظرفیت سانس', 'ظرفیت سانس ساعت ۲۱:۳۰ کنسرت حمید هیراد بیش از ۹۲٪ تکمیل شده است. پیشنهاد اضافه نمودن سانس فوق‌العاده.', 'WARNING', TRUE
WHERE NOT EXISTS (SELECT 1 FROM system_alerts WHERE title = 'هشدار ظرفیت سانس');

INSERT INTO system_alerts (title, message, alert_type, active)
SELECT 'رزرو گروهی مدارس', '۳ درخواست رزرو گروهی مدارس منطقه ۲ تهران در انتظار تأیید نهایی مالی است.', 'INFO', TRUE
WHERE NOT EXISTS (SELECT 1 FROM system_alerts WHERE title = 'رزرو گروهی مدارس');

INSERT INTO system_alerts (title, message, alert_type, active)
SELECT 'تسویه حساب مالی', 'فاکتور تسویه حساب دوره اول کنسرت پاپ صادر و تایید گردید.', 'SUCCESS', TRUE
WHERE NOT EXISTS (SELECT 1 FROM system_alerts WHERE title = 'تسویه حساب مالی');
