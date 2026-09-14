-- Migration: 20260914_store_settings_hero_banner.sql
-- Adds Hero Promotion Banner configuration keys to store_settings table
-- Enables hero banner display and sets festive default artwork and link target

INSERT INTO store_settings (key, value) VALUES
  ('hero_banner_enabled', 'true'),
  ('hero_banner_image_url', '/hero-banner.webp'),
  ('hero_banner_link_url', '#catalog')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value;
