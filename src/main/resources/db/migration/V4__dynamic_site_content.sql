-- Migration V4: every piece of content shown by the admin panel and the user site lives in the database.
-- Images referenced as /media/... are served by the backend (src/main/resources/static/media);
-- images uploaded from the admin panel are served from /uploads/...

-- ---------- Site settings ----------
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS short_name VARCHAR(60);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500);
-- logo_url is the artwork for light surfaces, logo_dark_url the artwork for dark / navy surfaces
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_dark_url VARCHAR(500);

INSERT INTO site_settings (site_name)
SELECT 'مرکز همایش و نمایش جوان' WHERE NOT EXISTS (SELECT 1 FROM site_settings);

UPDATE site_settings SET logo_url = '/media/brand/logo-dark.png' WHERE logo_url IS NULL OR logo_url = '/javan-logo.svg';
UPDATE site_settings SET logo_dark_url = '/media/brand/logo-light.png' WHERE logo_dark_url IS NULL;
UPDATE site_settings SET short_name = 'جوان' WHERE short_name IS NULL;
UPDATE site_settings SET tagline = 'تجربه‌های به یادماندنی، برای همه نسل‌ها' WHERE tagline IS NULL;
UPDATE site_settings SET meta_description = 'خرید بلیت آنلاین رویدادها، سیرک، کنسرت و برنامه‌های فرهنگی' WHERE meta_description IS NULL;

-- ---------- Categories: presentation managed from the admin panel ----------
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tagline VARCHAR(150);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
-- Default artwork for events / banners of this category that have no image of their own
ALTER TABLE categories ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

UPDATE categories c SET
    tagline = COALESCE(c.tagline, v.tagline),
    image_url = COALESCE(c.image_url, v.image_url),
    cover_url = COALESCE(c.cover_url, v.cover_url),
    color = COALESCE(c.color, v.color),
    sort_order = v.sort_order
FROM (VALUES
    ('technology', 'نمایشگاه‌ها و رویدادها', '/media/categories/technology.png', '/media/events/technology.webp', '#16b981', 1),
    ('concert', 'موسیقی زنده', '/media/categories/concert.png', '/media/events/concert.webp', '#2f80f5', 2),
    ('circus', 'هیجان و سرگرمی', '/media/categories/circus.png', '/media/events/circus.webp', '#8b5cf6', 3),
    ('family', 'تفریح برای همه', '/media/categories/family.png', '/media/events/theater.webp', '#f59e0b', 4),
    ('child', 'شادی و آموزش', '/media/categories/child.png', '/media/events/puppet.webp', '#f43f5e', 5),
    ('ai', 'فناوری و آینده', NULL, '/media/events/technology.webp', '#0ea5e9', 6),
    ('citizenship', 'رویدادهای شهری', NULL, '/media/events/theater.webp', '#64748b', 7)
) AS v(slug, tagline, image_url, cover_url, color, sort_order)
WHERE c.slug = v.slug;

-- Seed rows pointed at images that were never shipped; fall back to the category artwork instead.
UPDATE events SET banner_url = NULL WHERE banner_url LIKE '/images/%';

ALTER TABLE banners ALTER COLUMN image_url DROP NOT NULL;
UPDATE banners SET image_url = '/media/home/hero-fallback.webp' WHERE image_url = '/hero-banner.jpg';
UPDATE banners SET image_url = NULL WHERE image_url LIKE '/images/%';

-- ---------- Header and footer navigation ----------
CREATE TABLE IF NOT EXISTS link_groups (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    placement VARCHAR(20) NOT NULL, -- HEADER, FOOTER
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES link_groups(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    open_in_new_tab BOOLEAN DEFAULT FALSE
);

-- ---------- Content pages (about, contact, terms, ...) ----------
CREATE TABLE IF NOT EXISTS pages (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pages (slug, title, content, active) VALUES
('about', 'معرفی مرکز جوان', 'مرکز همایش و نمایش جوان، سامانه رسمی بلیت‌فروشی و مدیریت رویدادهای فرهنگی کشور است.', TRUE),
('contact', 'تماس با ما', 'برای ارتباط با ما می‌توانید از راه‌های زیر استفاده کنید.', TRUE),
-- Drafts: the admin writes the text and activates them (and their footer links) from the panel.
('buy-guide', 'راهنمای خرید بلیت', '', FALSE),
('faq', 'سوالات متداول', '', FALSE),
('terms', 'قوانین و مقررات', '', FALSE),
('privacy', 'حریم خصوصی', '', FALSE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO link_groups (title, placement, sort_order) VALUES
('منوی اصلی', 'HEADER', 1),
('درباره ما', 'FOOTER', 2),
('راهنمای کاربران', 'FOOTER', 3);

INSERT INTO links (group_id, title, url, sort_order, active)
SELECT g.id, v.title, v.url, v.sort_order, v.active
FROM link_groups g
JOIN (VALUES
    ('HEADER', 'صفحه اصلی', '/', 1, TRUE),
    ('HEADER', 'رویدادها', '/events', 2, TRUE),
    ('HEADER', 'درباره ما', '/about', 3, TRUE),
    ('HEADER', 'تماس با ما', '/contact', 4, TRUE),
    ('درباره ما', 'معرفی مرکز جوان', '/about', 1, TRUE),
    ('درباره ما', 'همه رویدادها', '/events', 2, TRUE),
    ('درباره ما', 'تماس با ما', '/contact', 3, TRUE),
    ('راهنمای کاربران', 'راهنمای خرید بلیت', '/buy-guide', 1, FALSE),
    ('راهنمای کاربران', 'سوالات متداول', '/faq', 2, FALSE),
    ('راهنمای کاربران', 'قوانین و مقررات', '/terms', 3, FALSE),
    ('راهنمای کاربران', 'حریم خصوصی', '/privacy', 4, FALSE)
) AS v(grp, title, url, sort_order, active)
    ON (v.grp = 'HEADER' AND g.placement = 'HEADER') OR (v.grp <> 'HEADER' AND g.placement = 'FOOTER' AND g.title = v.grp);

-- ---------- "Why buy from us" strip ----------
CREATE TABLE IF NOT EXISTS site_features (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO site_features (title, description, icon_url, sort_order) VALUES
('پرداخت امن', 'با درگاه‌های معتبر بانکی', '/media/features/secure.png', 1),
('صدور آنی بلیت', 'دریافت بلیت به صورت آنلاین', '/media/features/ticket.png', 2),
('پشتیبانی ۲۴ ساعته', 'همراه شما در تمام مراحل', '/media/features/support.png', 3),
('تنوع رویدادها', 'از کنسرت تا نمایش و نمایشگاه', '/media/features/variety.png', 4);

-- ---------- Event rows on the homepage ----------
CREATE TABLE IF NOT EXISTS home_sections (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    section_type VARCHAR(20) NOT NULL, -- THIS_WEEK, FEATURED, POPULAR, LATEST, CATEGORY
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    item_limit INT NOT NULL DEFAULT 5,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO home_sections (title, subtitle, section_type, item_limit, sort_order) VALUES
('رویدادهای این هفته', 'بهترین رویدادها در سراسر ایران', 'THIS_WEEK', 5, 1),
('رویدادهای ویژه', 'انتخاب‌های برگزیده مرکز همایش و نمایش جوان', 'FEATURED', 5, 2),
('رویدادهای محبوب', 'پربازدیدترین رویدادها از نگاه مخاطبان', 'POPULAR', 5, 3);

-- ---------- Newsletter ----------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Admin panel navigation ----------
CREATE TABLE IF NOT EXISTS admin_menu_sections (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    tile_url VARCHAR(500),
    tone VARCHAR(20) NOT NULL DEFAULT 'blue', -- amber, blue, red, green, purple, mint, sky, pink
    tall BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_menu_items (
    id BIGSERIAL PRIMARY KEY,
    item_key VARCHAR(60) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    path VARCHAR(200) NOT NULL,
    icon VARCHAR(50) NOT NULL, -- icon name understood by the admin panel
    section_id BIGINT REFERENCES admin_menu_sections(id) ON DELETE SET NULL,
    section_order INT DEFAULT 0,
    sidebar_group INT NOT NULL DEFAULT 1,
    sidebar_order INT DEFAULT 0,
    -- Screen exists in the panel; menu entries without one show the "coming soon" page
    implemented BOOLEAN DEFAULT FALSE,
    permission_code VARCHAR(100),
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO admin_menu_sections (title, description, tile_url, tone, tall, sort_order) VALUES
('مدیریت موقعیت‌ها', 'شهرها، سالن‌ها و نقشه‌های صندلی', '/media/menu/tile-location.png', 'amber', FALSE, 1),
('مدیریت رویدادها', 'ایجاد و مدیریت رویدادها و برنامه‌ها', '/media/menu/tile-calendar.png', 'blue', FALSE, 2),
('مدیریت اصلی', 'نمای کلی سامانه و آمار و اطلاعات کلیدی', '/media/menu/tile-home.png', 'red', FALSE, 3),
('محتوای سایت', 'بنرها، منوها، صفحات و محتوای صفحه اصلی', '/media/menu/tile-document.png', 'blue', FALSE, 4),
('مدیریت ارتباط با مشتریان', 'اطلاعات مخاطبان و تعاملات سازمانی', '/media/menu/tile-crm.png', 'mint', FALSE, 5),
('امور مالی', 'تراکنش‌ها و تسویه حساب‌ها', '/media/menu/tile-reports.png', 'purple', FALSE, 6),
('فروش و سفارشات', 'مدیریت فروش بلیت و سفارشات', '/media/menu/tile-finance.png', 'green', TRUE, 7),
('تنظیمات و زیرساخت', 'تنظیمات سامانه، اعلان‌ها و لاگ فعالیت‌ها', '/media/menu/tile-settings.png', 'sky', FALSE, 8),
('مدیریت کاربران و دسترسی‌ها', 'کاربران سامانه، نقش‌ها و سطح دسترسی‌ها', '/media/menu/tile-users.png', 'pink', FALSE, 9);

INSERT INTO admin_menu_items (item_key, title, description, path, icon, section_id, section_order, sidebar_group, sidebar_order, implemented)
SELECT v.item_key, v.title, v.description, v.path, v.icon, s.id, v.section_order, v.sidebar_group, v.sidebar_order, v.implemented
FROM (VALUES
    ('dashboard', 'داشبورد', 'نمایش آمار، نمودارها و وضعیت کلی سامانه', '/dashboard', 'House', 'مدیریت اصلی', 1, 1, 1, TRUE),
    ('events', 'رویدادها', 'مدیریت رویدادها و سانس‌های آن‌ها', '/events', 'CalendarDays', 'مدیریت رویدادها', 1, 1, 2, TRUE),
    ('categories', 'دسته‌بندی‌ها', 'دسته‌بندی رویدادها و ظاهر آن‌ها در سایت', '/categories', 'Tags', 'مدیریت رویدادها', 2, 1, 3, TRUE),
    ('rotationCalendar', 'تقویم چرخشی', 'نمایش رویدادها در تقویم و مدیریت زمان‌بندی', '/rotation-calendar', 'CalendarSync', 'مدیریت رویدادها', 3, 1, 4, FALSE),
    ('cities', 'شهرها', 'مدیریت شهرهای برگزاری رویداد', '/cities', 'MapPin', 'مدیریت موقعیت‌ها', 1, 1, 5, TRUE),
    ('halls', 'سالن‌ها', 'مدیریت سالن‌ها و مشخصات آن‌ها', '/halls', 'Building2', 'مدیریت موقعیت‌ها', 2, 1, 6, TRUE),
    ('seatMaps', 'نقشه صندلی‌ها', 'طراحی و مدیریت نقشه صندلی سالن‌ها', '/seat-maps', 'Armchair', 'مدیریت موقعیت‌ها', 3, 1, 7, FALSE),
    ('sessions', 'سانس‌ها', 'تعریف و مدیریت سانس‌های نمایش', '/sessions', 'Clock', 'مدیریت موقعیت‌ها', 4, 1, 8, FALSE),
    ('banners', 'بنرهای صفحه اصلی', 'اسلایدهای بالای صفحه اصلی سایت', '/banners', 'Images', 'محتوای سایت', 1, 2, 1, TRUE),
    ('homeSections', 'بخش‌های صفحه اصلی', 'ردیف‌های رویداد در صفحه اصلی سایت', '/home-sections', 'LayoutList', 'محتوای سایت', 2, 2, 2, TRUE),
    ('features', 'مزایای خرید', 'نوار مزایای خرید در صفحه اصلی', '/features', 'BadgeCheck', 'محتوای سایت', 3, 2, 3, TRUE),
    ('navigation', 'منوهای سایت', 'لینک‌های منوی بالا و ستون‌های فوتر', '/navigation', 'Link2', 'محتوای سایت', 4, 2, 4, TRUE),
    ('pages', 'صفحات محتوایی', 'درباره ما، تماس با ما، قوانین و سایر صفحات', '/pages', 'FileText', 'محتوای سایت', 5, 2, 5, TRUE),
    ('newsletter', 'اعضای خبرنامه', 'ایمیل‌های ثبت‌شده در خبرنامه سایت', '/newsletter', 'Mail', 'محتوای سایت', 6, 2, 6, TRUE),
    ('orders', 'فروش و سفارشات', 'مدیریت فروش بلیت و سفارشات کاربران', '/orders', 'ShoppingCart', 'فروش و سفارشات', 1, 3, 1, FALSE),
    ('organizations', 'مدارس و سازمان‌ها', 'مدیریت مشتریان سازمانی و مدارس', '/organizations', 'Landmark', 'فروش و سفارشات', 2, 3, 2, FALSE),
    ('groupReservations', 'رزروهای گروهی', 'ثبت و مدیریت رزروهای گروهی', '/group-reservations', 'Users', 'فروش و سفارشات', 3, 3, 3, FALSE),
    ('invoices', 'پیش‌فاکتورها', 'صدور و پیگیری پیش‌فاکتورهای فروش', '/invoices', 'FileText', 'فروش و سفارشات', 4, 3, 4, FALSE),
    ('discounts', 'تخفیف و کد معرف', 'مدیریت تخفیف‌ها و کدهای معرف', '/discounts', 'Tag', 'فروش و سفارشات', 5, 3, 5, FALSE),
    ('gateControl', 'کنترل گیت', 'کنترل ورود و اعتبارسنجی بلیت‌ها', '/gate-control', 'ScanLine', 'فروش و سفارشات', 6, 3, 6, FALSE),
    ('finance', 'امور مالی', 'نمای کلی تراکنش‌ها و گزارش‌های مالی', '/finance', 'Wallet', 'امور مالی', 1, 4, 1, FALSE),
    ('settlements', 'تسویه حساب‌ها', 'مدیریت تسویه با برگزارکنندگان و طرف حساب‌ها', '/settlements', 'CreditCard', 'امور مالی', 2, 4, 2, FALSE),
    ('crm', 'CRM', 'مدیریت اطلاعات مشتریان و ارتباطات', '/crm', 'Users', 'مدیریت ارتباط با مشتریان', 1, 4, 3, FALSE),
    ('reports', 'گزارش‌ها', 'گزارش‌های تحلیلی و آماری سامانه', '/reports', 'ChartColumn', 'مدیریت ارتباط با مشتریان', 2, 4, 4, FALSE),
    ('users', 'کاربران و مدیران', 'مدیریت کاربران و حساب‌های کاربری', '/users', 'UserRound', 'مدیریت کاربران و دسترسی‌ها', 1, 5, 1, FALSE),
    ('roles', 'نقش‌ها و دسترسی‌ها', 'تعریف نقش‌ها و سطح دسترسی کاربران', '/roles', 'Shield', 'مدیریت کاربران و دسترسی‌ها', 2, 5, 2, FALSE),
    ('notifications', 'هشدارها و اعلان‌ها', 'هشدارهای سیستمی نمایش‌داده‌شده در داشبورد', '/notifications', 'MessageSquareText', 'تنظیمات و زیرساخت', 1, 5, 3, TRUE),
    ('settings', 'تنظیمات سامانه', 'نام، لوگو، اطلاعات تماس و متن‌های پایه سایت', '/settings', 'Settings', 'تنظیمات و زیرساخت', 2, 5, 4, TRUE),
    ('activityLogs', 'لاگ فعالیت‌ها', 'ثبت و مشاهده سوابق و فعالیت‌های کاربران', '/activity-logs', 'FileClock', 'تنظیمات و زیرساخت', 3, 5, 5, FALSE)
) AS v(item_key, title, description, path, icon, section_title, section_order, sidebar_group, sidebar_order, implemented)
LEFT JOIN admin_menu_sections s ON s.title = v.section_title
ON CONFLICT (item_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_links_group ON links(group_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_sessions_event ON sessions(event_id);
