-- Maintenance ("coming soon") page: while enabled, the public address shows it and the full site is only reachable
-- through /preview (which sets a preview cookie). Title/text are edited in the admin settings page.
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_title VARCHAR(150);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS maintenance_text TEXT;

UPDATE site_settings
SET maintenance_title = 'در حال بهینه‌سازی و افزودن قابلیت‌های جدید هستیم'
WHERE maintenance_title IS NULL;

UPDATE site_settings
SET maintenance_text = 'تیم ما در حال ارتقای زیرساخت سامانه و پیاده‌سازی امکانات تازه برای تجربه‌ای سریع‌تر، امن‌تر و راحت‌تر در خرید بلیت است. به‌زودی با نسخه‌ای جدید و بهتر در خدمت شما خواهیم بود؛ از صبر و همراهی شما سپاسگزاریم.'
WHERE maintenance_text IS NULL;
