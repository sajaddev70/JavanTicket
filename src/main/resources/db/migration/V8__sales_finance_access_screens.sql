-- Migration V8: schema for the remaining admin screens: orders, schools & organizations, group reservations,
-- pro-forma invoices, gate control, finance, settlements, CRM, reports, users, roles & permissions, activity log.

-- ---------- Users ----------
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;

-- ---------- Orders / tickets ----------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS used_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_tickets_session ON tickets(session_id);

-- ---------- Schools & organizations ----------
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS economic_code VARCHAR(30);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS members_count INT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'; -- ACTIVE, INACTIVE
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS notes TEXT;
-- org_type also allows UNIVERSITY and COMPANY: SCHOOL, UNIVERSITY, ORGANIZATION, COMPANY

-- ---------- Group reservations ----------
ALTER TABLE group_reservations ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE group_reservations ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE group_reservations ADD COLUMN IF NOT EXISTS total_amount DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE group_reservations ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE group_reservations ADD COLUMN IF NOT EXISTS contact_mobile VARCHAR(15);
ALTER TABLE group_reservations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE group_reservations ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
-- status: PENDING, CONFIRMED, CANCELLED, COMPLETED

-- ---------- Pro-forma invoices ----------
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    group_reservation_id BIGINT REFERENCES group_reservations(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ISSUED, PAID, CANCELLED
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
    tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    notes TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(300) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ---------- Settlements with organizers ----------
CREATE TABLE IF NOT EXISTS settlements (
    id BIGSERIAL PRIMARY KEY,
    settlement_number VARCHAR(30) NOT NULL UNIQUE,
    payee_name VARCHAR(150) NOT NULL,
    event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
    period_from DATE,
    period_to DATE,
    gross_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
    commission_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    iban VARCHAR(34),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PAID, REJECTED
    reference_code VARCHAR(60),
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Gate control ----------
CREATE TABLE IF NOT EXISTS gate_scans (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT REFERENCES tickets(id) ON DELETE SET NULL,
    ticket_code VARCHAR(100) NOT NULL,
    session_id BIGINT REFERENCES sessions(id) ON DELETE SET NULL,
    gate_name VARCHAR(50),
    result VARCHAR(20) NOT NULL, -- ACCEPTED, ALREADY_USED, CANCELLED, WRONG_SESSION, INVALID
    operator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gate_scans_scanned_at ON gate_scans(scanned_at);

-- ---------- CRM ----------
CREATE TABLE IF NOT EXISTS crm_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL DEFAULT 'CALL', -- CALL, SMS, EMAIL, MEETING, SUPPORT
    subject VARCHAR(200) NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, FOLLOW_UP, CLOSED
    follow_up_at TIMESTAMP,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Activity log ----------
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    actor_mobile VARCHAR(15),
    actor_name VARCHAR(100),
    action VARCHAR(20) NOT NULL, -- LOGIN, CREATE, UPDATE, DELETE, ACTION
    section VARCHAR(60),
    description VARCHAR(500),
    method VARCHAR(10),
    path VARCHAR(300),
    status_code INT,
    ip_address VARCHAR(64),
    user_agent VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ---------- Roles & permissions: one permission per admin screen ----------
ALTER TABLE roles ADD COLUMN IF NOT EXISTS system_role BOOLEAN DEFAULT FALSE;
UPDATE roles SET system_role = TRUE WHERE name = 'SUPER_ADMIN';

DELETE FROM role_permissions;
DELETE FROM permissions;
INSERT INTO permissions (code, title_fa)
SELECT item_key, title FROM admin_menu_items ON CONFLICT (code) DO NOTHING;
UPDATE admin_menu_items SET permission_code = item_key;

INSERT INTO roles (name, title_fa, description) VALUES
('GATE_OPERATOR', 'اپراتور گیت', 'اعتبارسنجی بلیت‌ها در ورودی سالن'),
('SALES_MANAGER', 'کارشناس فروش', 'مدیریت سفارشات، رزروهای گروهی و پیش‌فاکتورها'),
('CONTENT_MANAGER', 'مدیر محتوا', 'مدیریت محتوای سایت')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON (
    (r.name = 'EVENT_MANAGER' AND p.code IN ('dashboard', 'events', 'categories', 'rotationCalendar', 'cities', 'halls', 'seatMaps', 'sessions'))
    OR (r.name = 'FINANCE_MANAGER' AND p.code IN ('dashboard', 'orders', 'invoices', 'finance', 'settlements', 'reports', 'discounts'))
    OR (r.name = 'GATE_OPERATOR' AND p.code IN ('gateControl'))
    OR (r.name = 'SALES_MANAGER' AND p.code IN ('dashboard', 'orders', 'organizations', 'groupReservations', 'invoices', 'discounts', 'crm'))
    OR (r.name = 'CONTENT_MANAGER' AND p.code IN ('dashboard', 'banners', 'homeSections', 'features', 'navigation', 'pages', 'newsletter', 'pageBlocks', 'notifications'))
)
ON CONFLICT DO NOTHING;

-- ---------- Admin menu: every screen now exists ----------
UPDATE admin_menu_items SET implemented = TRUE
WHERE item_key IN ('orders', 'organizations', 'groupReservations', 'invoices', 'gateControl', 'finance', 'settlements',
                   'crm', 'reports', 'users', 'roles', 'activityLogs');
