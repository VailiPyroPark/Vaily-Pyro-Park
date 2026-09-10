-- Migration: 20260910_seed_discount_percentage.sql
-- Description: Seed global discount percentage into store_settings

INSERT INTO store_settings (key, value) VALUES
  ('discount_percentage', '75')
ON CONFLICT (key) DO NOTHING;
