-- Migration V10: service fee ("هزینه خدمات سامانه") charged on top of the tickets, as a percent of the amount after
-- discount. Set in the admin panel's site settings; 0 (the default) means no fee.
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS service_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 0;
-- Fee of each order, already included in total_amount.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee DECIMAL(12,2) NOT NULL DEFAULT 0;
