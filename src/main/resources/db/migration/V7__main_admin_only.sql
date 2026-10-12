-- Remove the placeholder accounts seeded by V1; the only admin is 09101414285 (created by MainAdminSeeder).
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE mobile IN ('09123456789', '09120000000'));
DELETE FROM users WHERE mobile IN ('09123456789', '09120000000');
