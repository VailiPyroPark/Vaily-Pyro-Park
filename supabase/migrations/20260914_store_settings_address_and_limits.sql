-- Migration: 20260914_store_settings_address_and_limits.sql
-- Adds address, maximum order limit, and regional minimum order settings to store_settings

INSERT INTO store_settings (key, value) VALUES
  ('store_address', '142/A Bypass Road, Sivakasi Industrial Estate, Tamil Nadu - 626123'),
  ('max_order_limit_enabled', 'false'),
  ('max_order_limit_amount', '50000'),
  ('min_order_tamil_nadu', '3000'),
  ('min_order_other_states', '5000'),
  ('state_min_order_overrides', '{}')
ON CONFLICT (key) DO NOTHING;
