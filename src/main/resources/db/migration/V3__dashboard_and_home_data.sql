-- Migration V3: data needed by the redesigned admin dashboard and user homepage

-- City coordinates, used to place dynamic markers on the dashboard map
ALTER TABLE cities ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE cities ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);

UPDATE cities SET latitude = 35.689200, longitude = 51.389000 WHERE name = 'تهران' AND latitude IS NULL;
UPDATE cities SET latitude = 32.654600, longitude = 51.668000 WHERE name = 'اصفهان' AND latitude IS NULL;
UPDATE cities SET latitude = 29.591800, longitude = 52.583700 WHERE name = 'شیراز' AND latitude IS NULL;
UPDATE cities SET latitude = 36.297000, longitude = 59.605700 WHERE name = 'مشهد' AND latitude IS NULL;
UPDATE cities SET latitude = 38.080000, longitude = 46.291900 WHERE name = 'تبریز' AND latitude IS NULL;

-- Schools / organizations and their group reservations
CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    org_type VARCHAR(20) NOT NULL DEFAULT 'SCHOOL', -- SCHOOL, ORGANIZATION
    city_id BIGINT,
    contact_name VARCHAR(100),
    contact_mobile VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS group_reservations (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    session_id BIGINT,
    seats INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Hero banners can point at an event so date / hall / city come from the event itself
ALTER TABLE banners ADD COLUMN IF NOT EXISTS event_id BIGINT REFERENCES events(id) ON DELETE SET NULL;

UPDATE banners b SET event_id = e.id
FROM events e
WHERE b.event_id IS NULL AND b.link_url = '/events/' || e.slug;

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_group_reservations_created_at ON group_reservations(created_at);
