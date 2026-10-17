-- ============================================================
-- OpsInventory — Seed Data
-- Aman dijalankan berulang kali (INSERT IGNORE by unique key).
-- User & password TIDAK di-seed di sini. Gunakan:
--   npm run bootstrap:admin
-- ============================================================

INSERT IGNORE INTO asset_categories (name, description) VALUES
  ('Laptop',           'Laptop kantor dan perangkat portabel untuk staf'),
  ('Desktop',          'Komputer desktop dan workstation'),
  ('Monitor',          'Monitor eksternal dan display'),
  ('Printer',          'Printer kantor, scanner, dan multifungsi'),
  ('Network Equipment','Router, switch, access point, dan perangkat jaringan'),
  ('Server',           'Server fisik dan perangkat rak'),
  ('Peripheral',       'Keyboard, mouse, docking station, dan aksesoris'),
  ('Mobile Device',    'Smartphone dan tablet perusahaan');