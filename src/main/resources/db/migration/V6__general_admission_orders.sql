-- Migration V6: orders for sessions without a seat map (general admission) store how many tickets they cover.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INT;
