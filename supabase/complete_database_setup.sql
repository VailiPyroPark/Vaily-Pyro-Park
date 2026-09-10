-- ==============================================================================
-- COMPLETE DATABASE SETUP SCRIPT FOR VAILY PYRO PARK (SUPABASE POSTGRESQL 15)
-- Source: public/products.csv (Complete 166-Product Sivakasi Catalog & 15 Categories)
-- Includes:
--   1. Extensions (uuid-ossp, pg_trgm, pgcrypto)
--   2. Custom Enums (order_status, movement_type)
--   3. All 10 Tables (store_settings, categories, products, inventory, inventory_movements,
--                    combos, combo_items, delivery_zones, orders, order_items)
--   4. Sequences & Stored Procedures (order_seq, next_order_number, reserve_order_inventory)
--   5. High-Speed Trigram & Query Indexes
--   6. Full Row Level Security (RLS) Policies (Public Checkout & Admin Management)
--   7. Supabase Realtime Publication for Live Admin Sound & Order Alerts
--   8. Storage Bucket 'product-images' Setup & Object Policies
--   9. Admin User Auth Provisioning (vel56skc@gmail.com)
--  10. Complete Seed Data: 7 Settings, 3 Delivery Zones, 15 Categories,
--                          166 Products, 166 Inventory Balances, 2 Festival Combos
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ==============================================================================
-- 2. ENUM TYPES
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PACKING', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('PURCHASE', 'RESERVATION', 'SALE', 'CANCELLATION', 'DAMAGE', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- 3.1 STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(100),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    pack_size VARCHAR(100),
    mrp DECIMAL(10, 2) NOT NULL CHECK (mrp >= 0),
    selling_price DECIMAL(10, 2) NOT NULL CHECK (selling_price >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    sound_level VARCHAR(50) DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    available_stock INT NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    safety_threshold INT NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 INVENTORY MOVEMENTS AUDIT LOG
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type movement_type NOT NULL,
    quantity INT NOT NULL,
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 COMBOS & COMBO ITEMS
CREATE TABLE IF NOT EXISTS combos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    mrp DECIMAL(10, 2) NOT NULL CHECK (mrp >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combo_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- 3.7 DELIVERY ZONES
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(100) NOT NULL,
    state_codes TEXT[] NOT NULL,
    min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 3000.00,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    estimated_days VARCHAR(50) DEFAULT '2-3 Days',
    is_active BOOLEAN DEFAULT true
);

-- 3.8 ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'PENDING',
    admin_notes TEXT,
    courier_partner VARCHAR(100),
    tracking_number VARCHAR(100),
    estimated_delivery VARCHAR(50),
    is_paid BOOLEAN DEFAULT false,
    payment_method VARCHAR(50) DEFAULT 'COD',
    tags TEXT[] DEFAULT '{}',
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10, 2) NOT NULL
);

-- ==============================================================================
-- 4. HIGH-SPEED INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile ON orders(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(city);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at DESC);

-- ==============================================================================
-- 5. SEQUENCES & STORED PROCEDURES
-- ==============================================================================
CREATE SEQUENCE IF NOT EXISTS order_seq START 1001;

CREATE OR REPLACE FUNCTION next_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'VPP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reserve_order_inventory(
    p_items JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    item RECORD;
    v_available INT;
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
    LOOP
        SELECT available_stock INTO v_available 
        FROM inventory 
        WHERE product_id = item.product_id
        FOR UPDATE;

        IF v_available IS NULL OR v_available < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %', item.product_id;
        END IF;

        UPDATE inventory 
        SET available_stock = available_stock - item.quantity,
            reserved_stock = reserved_stock + item.quantity
        WHERE product_id = item.product_id;

        INSERT INTO inventory_movements (product_id, type, quantity, reason)
        VALUES (item.product_id, 'RESERVATION', item.quantity, 'Order placement stock reservation');
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent conflicts on re-execution
DROP POLICY IF EXISTS "Public store_settings read" ON store_settings;
DROP POLICY IF EXISTS "Admin store_settings write" ON store_settings;
DROP POLICY IF EXISTS "Public categories read" ON categories;
DROP POLICY IF EXISTS "Admin categories full access" ON categories;
DROP POLICY IF EXISTS "Public products read" ON products;
DROP POLICY IF EXISTS "Admin products full access" ON products;
DROP POLICY IF EXISTS "Public inventory read" ON inventory;
DROP POLICY IF EXISTS "Admin inventory full access" ON inventory;
DROP POLICY IF EXISTS "Public inventory_movements read" ON inventory_movements;
DROP POLICY IF EXISTS "Admin inventory_movements full access" ON inventory_movements;
DROP POLICY IF EXISTS "Public combos read" ON combos;
DROP POLICY IF EXISTS "Admin combos full access" ON combos;
DROP POLICY IF EXISTS "Public combo_items read" ON combo_items;
DROP POLICY IF EXISTS "Admin combo_items full access" ON combo_items;
DROP POLICY IF EXISTS "Public delivery_zones read" ON delivery_zones;
DROP POLICY IF EXISTS "Admin delivery_zones write" ON delivery_zones;
DROP POLICY IF EXISTS "Public orders insert" ON orders;
DROP POLICY IF EXISTS "Public orders read own" ON orders;
DROP POLICY IF EXISTS "Admin orders full access" ON orders;
DROP POLICY IF EXISTS "Public order_items insert" ON order_items;
DROP POLICY IF EXISTS "Public order_items read" ON order_items;
DROP POLICY IF EXISTS "Admin order_items full access" ON order_items;

-- Storefront Public Read Policies
CREATE POLICY "Public store_settings read" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Public categories read" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public products read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public inventory read" ON inventory FOR SELECT USING (true);
CREATE POLICY "Public inventory_movements read" ON inventory_movements FOR SELECT USING (true);
CREATE POLICY "Public combos read" ON combos FOR SELECT USING (is_active = true);
CREATE POLICY "Public combo_items read" ON combo_items FOR SELECT USING (true);
CREATE POLICY "Public delivery_zones read" ON delivery_zones FOR SELECT USING (is_active = true);

-- Checkout Public Order Placement Policies
CREATE POLICY "Public orders insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders read own" ON orders FOR SELECT USING (true);
CREATE POLICY "Public order_items insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public order_items read" ON order_items FOR SELECT USING (true);

-- Authenticated Admin Management Policies
CREATE POLICY "Admin store_settings write" ON store_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin categories full access" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin products full access" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin inventory full access" ON inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin inventory_movements full access" ON inventory_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin combos full access" ON combos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin combo_items full access" ON combo_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delivery_zones write" ON delivery_zones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin orders full access" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin order_items full access" ON order_items FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================================================
-- 7. SUPABASE REALTIME REPLICATION PUBLICATION
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

ALTER TABLE orders REPLICA IDENTITY FULL;

-- ==============================================================================
-- 8. STORAGE BUCKET FOR PRODUCT IMAGES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 10485760;

DROP POLICY IF EXISTS "Allow public reads from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from product-images" ON storage.objects;

CREATE POLICY "Allow public reads from product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public uploads to product-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public updates to product-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes from product-images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'product-images');

-- ==============================================================================
-- 9. ADMIN USER AUTH SETUP (vel56skc@gmail.com)
-- ==============================================================================
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'vel56skc@gmail.com';
  raw_password TEXT := 'VailyPyroAdmin@2026!'; 
  hashed_password TEXT;
BEGIN
  -- Generate bcrypt hash using pgcrypto extension
  hashed_password := extensions.crypt(raw_password, extensions.gen_salt('bf', 10));

  -- Clean up previous record if partially registered
  DELETE FROM auth.identities WHERE identity_data->>'email' = user_email OR provider_id = user_email;
  DELETE FROM auth.users WHERE email = user_email;

  -- Create authenticated admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    hashed_password,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Vaily Pyro Admin", "role": "admin"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id, user_email)::jsonb,
    'email',
    user_email,
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Admin user % created successfully with ID %', user_email, new_user_id;
END $$;

-- ==============================================================================
-- 10. CATALOG & STORE DATA SEEDING
-- ==============================================================================

-- 10.1 CLEAN EXISTING CATALOG & TRANSACTIONAL DATA (RE-RUNNABLE SEED)
TRUNCATE TABLE 
  order_items, 
  orders, 
  combo_items, 
  combos, 
  inventory_movements, 
  inventory, 
  products, 
  categories,
  delivery_zones 
CASCADE;

-- 10.2 SEED STORE SETTINGS
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'Vaily Pyro Park'),
  ('tagline', 'Sivakasi Direct Fireworks Outlet'),
  ('helpline_mobile', '+91 98401 23456'),
  ('whatsapp_number', '919840123456'),
  ('gstin', '33AAACV1234A1Z5'),
  ('announcement_banner', '⚡ DIWALI PRE-BOOKING OPEN: Get up to 80% OFF Factory Direct Rates!'),
  ('discount_percentage', '80')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 10.3 SEED REGIONAL DELIVERY ZONES
INSERT INTO delivery_zones (zone_name, state_codes, min_order_amount, delivery_fee, estimated_days) VALUES 
  ('Tamil Nadu (Home Zone)', ARRAY['TN', 'Tamil Nadu'], 3000.00, 0.00, '1-2 Days'),
  ('South India (Kerala, Karnataka, AP, Telangana, Puducherry)', ARRAY['PY', 'KL', 'KA', 'AP', 'TS', 'Puducherry', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'], 4000.00, 150.00, '2-4 Days'),
  ('Rest of India', ARRAY['MH', 'DL', 'GJ', 'RJ', 'UP', 'WB', 'MP', 'HR', 'PB', 'ALL'], 5000.00, 250.00, '4-7 Days')
ON CONFLICT DO NOTHING;

-- 10.4 SEED 15 OFFICIAL SIVAKASI CATEGORIES
INSERT INTO categories (id, name, slug, description, icon_name, display_order, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'ONE SOUND CRACKERS', 'one-sound-crackers', 'Classic Single Sound Sivakasi Crackers', 'Volume2', 1, true),
  ('11111111-0000-0000-0000-000000000002', 'FLOWER POTS', 'flower-pots', 'Dazzling Sparkling Flower Pots Collection', 'Flame', 2, true),
  ('11111111-0000-0000-0000-000000000003', 'GROUND CHAKKAR', 'ground-chakkar', 'High Speed Spinning Ground Chakkaras', 'RotateCw', 3, true),
  ('11111111-0000-0000-0000-000000000004', 'TWINKLING STARS & PENCILS', 'twinkling-stars-pencils', 'Twinkling Stars & Colorful Sparkle Pencils', 'Sparkles', 4, true),
  ('11111111-0000-0000-0000-000000000005', 'ROCKETS', 'rockets', 'High Flying Sound and Whistling Sky Rockets', 'Rocket', 5, true),
  ('11111111-0000-0000-0000-000000000006', 'BOMBS', 'bombs', 'High Intensity Hydro, Deluxe & Paper Bombs', 'Volume2', 6, true),
  ('11111111-0000-0000-0000-000000000007', 'BIJILI CRACKERS', 'bijili-crackers', 'Traditional Red & Striped Bijili Crackers', 'Zap', 7, true),
  ('11111111-0000-0000-0000-000000000008', 'FOUNTAIN & VARIETIES', 'fountain-varieties', 'Colorful Fountains, Drones & Novelty Items', 'Sparkles', 8, true),
  ('11111111-0000-0000-0000-000000000009', 'FANCY CRACKERS', 'fancy-crackers', 'Spectacular Night Aerial Fancy Fireworks', 'Sparkles', 9, true),
  ('11111111-0000-0000-0000-000000000010', 'SILVER', 'silver', 'Premium Silver Celebration Fireworks Series', 'Sparkles', 10, true),
  ('11111111-0000-0000-0000-000000000011', 'GOLD', 'gold', 'Exclusive Gold Series Royal Sivakasi Fireworks', 'Sparkles', 11, true),
  ('11111111-0000-0000-0000-000000000012', 'WOW COLLECTION', 'wow-collection', 'Mega Multi-Shot Cakes & Sky Burst Showstoppers', 'Sparkles', 12, true),
  ('11111111-0000-0000-0000-000000000013', 'SPARKLERS', 'sparklers', 'Child-Safe Electric, Color & Mega Sparklers', 'Sparkles', 13, true),
  ('11111111-0000-0000-0000-000000000014', 'COLOUR MATCHES', 'colour-matches', 'Novelty Color Flame Matches & Safe Lights', 'Flame', 14, true),
  ('11111111-0000-0000-0000-000000000015', 'GIFT BOXES', 'gift-boxes', 'Grand Family Celebration & Kids Festival Gift Boxes', 'Gift', 15, true);

-- 10.5 SEED COMPLETE 166-PRODUCT OFFICIAL CATALOG (FROM public/products.csv)
INSERT INTO products (id, category_id, name, slug, sku, description, pack_size, mrp, selling_price, image_url, is_active, is_featured, is_best_seller, sound_level) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '2 3/4" Kuruvi', '2-34-kuruvi-vav-001', 'VAV-001', '2 3/4" குருவி', '5 Pcs', 80.00, 8.00, NULL, true, true, true, 'High'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '3 1/2" Lakshmi', '3-12-lakshmi-vav-002', 'VAV-002', '3 1/2" லட்சுமி', '5 Pcs', 110.00, 11.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '4" Lakshmi', '4-lakshmi-vav-003', 'VAV-003', '4" லட்சுமி', '5 Pcs', 190.00, 19.00, NULL, true, false, true, 'High'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '4" Deluxe Lakshmi', '4-deluxe-lakshmi-vav-004', 'VAV-004', '4" டீலக்ஸ் லட்சுமி', '5 Pcs', 250.00, 25.00, NULL, true, true, false, 'High'),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', '4" Gold Lakshmi', '4-gold-lakshmi-vav-005', 'VAV-005', '4" கோல்டு லட்சுமி', '5 Pcs', 300.00, 30.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', '5" Deluxe Lakshmi', '5-deluxe-lakshmi-vav-006', 'VAV-006', '5" டீலக்ஸ் லட்சுமி', '5 Pcs', 430.00, 43.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', '6" Deluxe Lakshmi/Jallikattu', '6-deluxe-lakshmijallikattu-vav-007', 'VAV-007', '6" டீலக்ஸ் லட்சுமி/ஜல்லிகட்டு', '5 Pcs', 660.00, 66.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', 'Two Sound Crackers', 'two-sound-crackers-vav-008', 'VAV-008', '2 சவுண்டு கிராக்காஸ்', '5 Pcs', 350.00, 35.00, NULL, true, false, true, 'High'),
  ('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000002', 'Flower Pots Special', 'flower-pots-special-vav-009', 'VAV-009', 'பூச்சட்டி ஸ்பெஷல்', '10 Pcs', 800.00, 80.00, NULL, true, true, false, 'Low'),
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000002', 'Flower Pots Ashoka', 'flower-pots-ashoka-vav-010', 'VAV-010', 'பூச்சட்டி அசோகா', '10 Pcs', 1200.00, 120.00, NULL, true, false, true, 'Low'),
  ('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000002', 'Flower Pots Deluxe', 'flower-pots-deluxe-vav-011', 'VAV-011', 'பூச்சட்டி டீலக்ஸ்', '5 Pcs', 2200.00, 220.00, NULL, true, false, false, 'Low'),
  ('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000002', 'Flower Pots Color Koti Dix', 'flower-pots-color-koti-dix-vav-012', 'VAV-012', 'பூச்சட்டி கலர் கோட்டி', '10 Pcs', 1900.00, 190.00, NULL, true, false, false, 'Low'),
  ('22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000003', 'Ground Chakkar Big', 'ground-chakkar-big-vav-013', 'VAV-013', 'தரைச்சக்கரம் பெரியது', '25 Pcs', 800.00, 80.00, NULL, true, true, false, 'Low'),
  ('22222222-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000003', 'Ground Chakkar Big', 'ground-chakkar-big-vav-014', 'VAV-014', 'தரைச்சக்கரம் பெரியது', '10 Pcs', 400.00, 40.00, NULL, true, false, true, 'Low'),
  ('22222222-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000003', 'Ground Chakkar Special', 'ground-chakkar-special-vav-015', 'VAV-015', 'தரைச்சக்கரம் ஸ்பெஷல்', '10 Pcs', 800.00, 80.00, NULL, true, false, false, 'Low'),
  ('22222222-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000003', 'Ground Chakkar Deluxe', 'ground-chakkar-deluxe-vav-016', 'VAV-016', 'தரைச்சக்கரம் டீலக்ஸ்', '10 Pcs', 1400.00, 140.00, NULL, true, false, false, 'Low'),
  ('22222222-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000003', 'Ground Chakkar Disco Wheel', 'ground-chakkar-disco-wheel-vav-017', 'VAV-017', 'தரைச்சக்கரம் டிஸ்கோ வீல்', '5 Pcs', 1200.00, 120.00, NULL, true, false, false, 'Low'),
  ('22222222-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000003', 'Wire Chakkar', 'wire-chakkar-vav-018', 'VAV-018', 'வயர் சக்கரம்', '10 Pcs', 1600.00, 160.00, NULL, true, false, false, 'Low'),
  ('22222222-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000003', 'Moon Wheel', 'moon-wheel-vav-019', 'VAV-019', 'மூன் வீல்', '10 Pcs', 2000.00, 200.00, NULL, true, false, false, 'Low'),
  ('22222222-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000004', '1 1/2" Twinkling Star', '1-12-twinkling-star-vav-020', 'VAV-020', '1 1/2" சாட்டை', '10 Pcs', 250.00, 25.00, NULL, true, true, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000004', '4" Twinkling Star', '4-twinkling-star-vav-021', 'VAV-021', '4" சாட்டை', '10 Pcs', 700.00, 70.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000004', '10" Pencil', '10-pencil-vav-022', 'VAV-022', '10" பென்சில்', '10 Pcs', 400.00, 40.00, NULL, true, false, true, 'Silent'),
  ('22222222-0000-0000-0000-000000000023', '11111111-0000-0000-0000-000000000004', '12" Pencil', '12-pencil-vav-023', 'VAV-023', '12" பென்சில்', '10 Pcs', 530.00, 53.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000024', '11111111-0000-0000-0000-000000000004', '15" Pencil', '15-pencil-vav-024', 'VAV-024', '15" பென்சில்', '10 Pcs', 800.00, 80.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000025', '11111111-0000-0000-0000-000000000004', '18" Pencil', '18-pencil-vav-025', 'VAV-025', '18" பென்சில்', '10 Pcs', 900.00, 90.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000026', '11111111-0000-0000-0000-000000000005', 'Rocket Bomb/Colour Rocket', 'rocket-bombcolour-rocket-vav-026', 'VAV-026', 'ராக்கெட் பாம் / கலர் ராக்கெட்', '10 Pcs', 700.00, 70.00, NULL, true, true, false, 'High'),
  ('22222222-0000-0000-0000-000000000027', '11111111-0000-0000-0000-000000000005', 'Whistling Rocket', 'whistling-rocket-vav-027', 'VAV-027', 'விசிலிங் ராக்கெட்', '10 Pcs', 1800.00, 180.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000028', '11111111-0000-0000-0000-000000000005', 'Lunik Rocket', 'lunik-rocket-vav-028', 'VAV-028', 'லூனிக் ராக்கெட்', '10 Pcs', 1400.00, 140.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000029', '11111111-0000-0000-0000-000000000005', '2 Sound Rocket', '2-sound-rocket-vav-029', 'VAV-029', '2 சவுண்டு ராக்கெட்', '10 Pcs', 1600.00, 160.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000030', '11111111-0000-0000-0000-000000000005', '3 Sound Rocket', '3-sound-rocket-vav-030', 'VAV-030', '3 சவுண்டு ராக்கெட்', '10 Pcs', 1800.00, 180.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000031', '11111111-0000-0000-0000-000000000006', 'Bullet Bomb/Super Bullet', 'bullet-bombsuper-bullet-vav-031', 'VAV-031', 'புல்லட் பாம்', '10 Pcs', 300.00, 30.00, NULL, true, true, false, 'High'),
  ('22222222-0000-0000-0000-000000000032', '11111111-0000-0000-0000-000000000006', 'Hydro Bomb', 'hydro-bomb-vav-032', 'VAV-032', 'ஹைட்ரோ பாம்', '10 Pcs', 700.00, 70.00, NULL, true, false, true, 'High'),
  ('22222222-0000-0000-0000-000000000033', '11111111-0000-0000-0000-000000000006', 'King Kong Bomb', 'king-kong-bomb-vav-033', 'VAV-033', 'கிங் காங் பாம்', '10 Pcs', 900.00, 90.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000034', '11111111-0000-0000-0000-000000000006', 'Classic Bomb', 'classic-bomb-vav-034', 'VAV-034', 'கிளாசிக் பாம்', '10 Pcs', 1200.00, 120.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000035', '11111111-0000-0000-0000-000000000006', 'Dinosaur Bomb', 'dinosaur-bomb-vav-035', 'VAV-035', 'டைனோசர் பாம்', '10 Pcs', 2200.00, 220.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000036', '11111111-0000-0000-0000-000000000006', 'Digital Bomb', 'digital-bomb-vav-036', 'VAV-036', 'டிஜிட்டல் பாம்', '10 Pcs', 2500.00, 250.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000037', '11111111-0000-0000-0000-000000000006', '555 Bomb', '555-bomb-vav-037', 'VAV-037', '555 பாம்', '10 Pcs', 1600.00, 160.00, NULL, true, false, true, 'High'),
  ('22222222-0000-0000-0000-000000000038', '11111111-0000-0000-0000-000000000006', '1/4 Kg Paper Bomb', '14-kg-paper-bomb-vav-038', 'VAV-038', '1/4 கிலோ பேப்பர் பாம்', '1 Pce', 450.00, 45.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000039', '11111111-0000-0000-0000-000000000006', '1/2 Kg Paper Bomb', '12-kg-paper-bomb-vav-039', 'VAV-039', '1/2 கிலோ பேப்பர் பாம்', '1 Pce', 900.00, 90.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000040', '11111111-0000-0000-0000-000000000006', '1 Kg Paper Bomb', '1-kg-paper-bomb-vav-040', 'VAV-040', '1 கிலோ பேப்பர் பாம்', '1 Pce', 1800.00, 180.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000041', '11111111-0000-0000-0000-000000000007', 'Red Bijili', 'red-bijili-vav-041', 'VAV-041', 'ரெட் பிஜிலி', '100 Pcs', 330.00, 33.00, NULL, true, true, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000042', '11111111-0000-0000-0000-000000000007', 'Stripped Bijili', 'stripped-bijili-vav-042', 'VAV-042', 'வரி', '100 Pcs', 350.00, 35.00, NULL, true, false, true, 'Medium'),
  ('22222222-0000-0000-0000-000000000043', '11111111-0000-0000-0000-000000000008', 'Butterfly', 'butterfly-vav-043', 'VAV-043', 'பட்டர்பிளை', '10 Pcs', 900.00, 90.00, NULL, true, true, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000044', '11111111-0000-0000-0000-000000000008', 'Mega Siren', 'mega-siren-vav-044', 'VAV-044', 'சைரன்', '3 Pcs', 1800.00, 180.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000045', '11111111-0000-0000-0000-000000000008', 'Shower', 'shower-vav-045', 'VAV-045', 'ஷவர்', '5 Pcs', 1200.00, 120.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000046', '11111111-0000-0000-0000-000000000008', 'Tri Colour Fountain', 'tri-colour-fountain-vav-046', 'VAV-046', 'டிரை கலர் பவுண்டைன்', '5 Pcs', 2500.00, 250.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000047', '11111111-0000-0000-0000-000000000008', 'Kit Kat/Chit Phut/TitTak', 'kit-katchit-phuttittak-vav-047', 'VAV-047', 'கிட் காட் / சிட் புட் / டிட்டாக்', '10 Pcs', 400.00, 40.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000048', '11111111-0000-0000-0000-000000000008', 'Photo Flash', 'photo-flash-vav-048', 'VAV-048', 'போட்டோ பிளாஸ்', '5 Pcs', 700.00, 70.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000049', '11111111-0000-0000-0000-000000000008', 'Peacock', 'peacock-vav-049', 'VAV-049', 'பீகாக்', '1 Pce', 1600.00, 160.00, NULL, true, true, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000050', '11111111-0000-0000-0000-000000000008', 'Helicopter', 'helicopter-vav-050', 'VAV-050', 'ஹெலிகாப்டர்', '5 Pcs', 1000.00, 100.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000051', '11111111-0000-0000-0000-000000000008', 'Drone', 'drone-vav-051', 'VAV-051', 'ட்ரோன்', '5 Pcs', 1600.00, 160.00, NULL, true, false, true, 'Medium'),
  ('22222222-0000-0000-0000-000000000052', '11111111-0000-0000-0000-000000000008', 'Tin Beer', 'tin-beer-vav-052', 'VAV-052', 'டின் பீர்', '1 Pce', 1200.00, 120.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000053', '11111111-0000-0000-0000-000000000008', 'Peacock Feather', 'peacock-feather-vav-053', 'VAV-053', 'பிகாக் பேதர்', '5 Pcs', 1000.00, 100.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000054', '11111111-0000-0000-0000-000000000008', 'Golden Rain', 'golden-rain-vav-054', 'VAV-054', 'கோல்டன் ரெயின்', '5 Pcs', 1000.00, 100.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000055', '11111111-0000-0000-0000-000000000008', 'Crorepati / Jockpot', 'crorepati-jockpot-vav-055', 'VAV-055', 'க்ரோர்பதி /ஜாக்பாட', '2 Pcs', 2200.00, 220.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000056', '11111111-0000-0000-0000-000000000008', 'Rainbow Smoke', 'rainbow-smoke-vav-056', 'VAV-056', 'ரெயின்போ ஸ்மோக்', '3 Pcs', 1500.00, 150.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000057', '11111111-0000-0000-0000-000000000008', 'Bambaram', 'bambaram-vav-057', 'VAV-057', 'பம்பரம்', '10 Pcs', 1200.00, 120.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000058', '11111111-0000-0000-0000-000000000008', 'Black Money', 'black-money-vav-058', 'VAV-058', 'ப்ளாக் மணி', '5 Pcs', 2200.00, 220.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000059', '11111111-0000-0000-0000-000000000008', 'Lollipop (Stick)', 'lollipop-stick-vav-059', 'VAV-059', 'லாலி பாப்(ஸ்டிக்)', '5 Pcs', 1700.00, 170.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000060', '11111111-0000-0000-0000-000000000008', 'Pada Peacock', 'pada-peacock-vav-060', 'VAV-060', 'படா பீகாக்', '1 Pce', 4000.00, 400.00, NULL, true, true, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000061', '11111111-0000-0000-0000-000000000008', '90 Watts', '90-watts-vav-061', 'VAV-061', '90 வாட்ஸ்', '3 Pcs', 1200.00, 120.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000062', '11111111-0000-0000-0000-000000000009', 'Chotta Fancy', 'chotta-fancy-vav-062', 'VAV-062', 'சோட்டா பேன்ஸி', '1 Box', 400.00, 40.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000063', '11111111-0000-0000-0000-000000000009', '2" Pipe (5 Varieties)', '2-pipe-5-varieties-vav-063', 'VAV-063', '2" பைப் (5 மாடல்)', '1 Pce', 1200.00, 120.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000064', '11111111-0000-0000-0000-000000000009', '2" Pipe', '2-pipe-vav-064', 'VAV-064', '2" பைப் (3 பீஸ்)', '3 Pcs', 2800.00, 280.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000065', '11111111-0000-0000-0000-000000000009', '3" Pipe (6 Varieties)', '3-pipe-6-varieties-vav-065', 'VAV-065', '3" பைப் (6 மாடல்)', '1 Pce', 2400.00, 240.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000066', '11111111-0000-0000-0000-000000000009', '3 1/2" Pipe (5 Varieties)', '3-12-pipe-5-varieties-vav-066', 'VAV-066', '3 1/2" பைப் (5 மாடல்)', '1 Pce', 3000.00, 300.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000067', '11111111-0000-0000-0000-000000000009', '4" Pipe (5 Varieties)', '4-pipe-5-varieties-vav-067', 'VAV-067', '4" பைப் (5 மாடல்)', '1 Pce', 3500.00, 350.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000068', '11111111-0000-0000-0000-000000000009', '4" Pipe NayagraFalls (Spl)', '4-pipe-nayagrafalls-spl-vav-068', 'VAV-068', '4" பைப் நயாகரா அருவி', '1 Pce', 4000.00, 400.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000069', '11111111-0000-0000-0000-000000000009', '4" 7 Steps', '4-7-steps-vav-069', 'VAV-069', '4" 7 ஸ்டெப்ஸ் (1 பீஸ்)', '1 Pce', 4300.00, 430.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000070', '11111111-0000-0000-0000-000000000009', '4" 12 Steps', '4-12-steps-vav-070', 'VAV-070', '4" 12', '1 Pce', 4800.00, 480.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000071', '11111111-0000-0000-0000-000000000009', '4" Pipe', '4-pipe-vav-071', 'VAV-071', '4"', '2 Pcs', 9000.00, 900.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000072', '11111111-0000-0000-0000-000000000009', '5" Pipe Orange', '5-pipe-orange-vav-072', 'VAV-072', '5" பைப் ஆரஞ்சு (1 பீஸ்)', '1 Pc', 5300.00, 530.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000073', '11111111-0000-0000-0000-000000000009', '5" Pipe Lemon', '5-pipe-lemon-vav-073', 'VAV-073', '5" பைப் லெமன் (1 பீஸ்)', '1 Pc', 5300.00, 530.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000074', '11111111-0000-0000-0000-000000000009', '5" Pipe Purble', '5-pipe-purble-vav-074', 'VAV-074', '5" பைப் பர்பிள் (1பீஸ்)', '1 Pc', 5300.00, 530.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000075', '11111111-0000-0000-0000-000000000009', '5" Pipe', '5-pipe-vav-075', 'VAV-075', '5" பைப் (2 பீஸ்)', '2 Pcs', 10000.00, 1000.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000076', '11111111-0000-0000-0000-000000000009', 'Cool Baby Cool', 'cool-baby-cool-vav-076', 'VAV-076', 'கூல் பேபி கூல்', '5 Pcs', 2000.00, 200.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000077', '11111111-0000-0000-0000-000000000009', '7 Shots Multicolour', '7-shots-multicolour-vav-077', 'VAV-077', '7 ஷாட் மல்டி கலர்', '5 Pcs', 1100.00, 110.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000078', '11111111-0000-0000-0000-000000000009', '12 Shots Rider / Crackling', '12-shots-rider-crackling-vav-078', 'VAV-078', '12 ஷாட் ரைடர் / கிராக்லிங்', '1 Box', 1400.00, 140.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000079', '11111111-0000-0000-0000-000000000009', '25 Shots Rider / Crackling', '25-shots-rider-crackling-vav-079', 'VAV-079', '25 ஷாட் ரைடர் / கிராக்லிங்', '1 Box', 2500.00, 250.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000080', '11111111-0000-0000-0000-000000000010', '30 Shots Multicolour', '30-shots-multicolour-vav-080', 'VAV-080', '30 ஷாட் மல்டி கலர்', '1 Box', 3500.00, 350.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000081', '11111111-0000-0000-0000-000000000010', '60 Shots Multicolour', '60-shots-multicolour-vav-081', 'VAV-081', '60 ஷாட் மல்டி கலர்', '1 Box', 7000.00, 700.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000082', '11111111-0000-0000-0000-000000000010', '120 Shots Multicolour', '120-shots-multicolour-vav-082', 'VAV-082', '120 ஷாட் மல்டி கலர்', '1 Box', 14000.00, 1400.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000083', '11111111-0000-0000-0000-000000000011', '30 Shots Multicolour', '30-shots-multicolour-vav-083', 'VAV-083', '30 ஷாட் மல்டி கலர்', '1 Box', 4000.00, 400.00, NULL, true, true, false, 'High'),
  ('22222222-0000-0000-0000-000000000084', '11111111-0000-0000-0000-000000000011', '60 Shots Multicolour', '60-shots-multicolour-vav-084', 'VAV-084', '60 ஷாட் மல்டி கலர்', '1 Box', 8000.00, 800.00, NULL, true, false, true, 'High'),
  ('22222222-0000-0000-0000-000000000085', '11111111-0000-0000-0000-000000000011', '120 Shots Multicolour', '120-shots-multicolour-vav-085', 'VAV-085', '120 ஷாட் மல்டி கலர்', '1 Box', 16000.00, 1600.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000086', '11111111-0000-0000-0000-000000000011', '240 Shots Multicolour', '240-shots-multicolour-vav-086', 'VAV-086', '240 ஷாட் மல்டி கலர்', '1 Box', 32000.00, 3200.00, NULL, true, false, false, 'High'),
  ('22222222-0000-0000-0000-000000000087', '11111111-0000-0000-0000-000000000012', 'Money Penny (Standard FW)', 'money-penny-standard-fw-vav-087', 'VAV-087', 'மணி பென்னி', '5 Pcs', 3550.00, 355.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000088', '11111111-0000-0000-0000-000000000012', 'Sun Drops (Standard FW)', 'sun-drops-standard-fw-vav-088', 'VAV-088', 'சன் ட்ராப்ஸ்', '5 Pcs', 3550.00, 355.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000089', '11111111-0000-0000-0000-000000000012', 'Twin Spin (Standard FW)', 'twin-spin-standard-fw-vav-089', 'VAV-089', 'ட்வின் ஸ்பின்', '5 Pcs', 1550.00, 155.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000090', '11111111-0000-0000-0000-000000000012', 'Scarlet Saucer (Standard FW)', 'scarlet-saucer-standard-fw-vav-090', 'VAV-090', 'ஸ்கேர்லட் சாஸர்', '5 Pcs', 1550.00, 155.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000091', '11111111-0000-0000-0000-000000000012', 'Red & White Chakkar''s (Standard FW)', 'red-white-chakkars-standard-fw-vav-091', 'VAV-091', '&', '10 Pcs', 880.00, 88.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000092', '11111111-0000-0000-0000-000000000012', 'Colour Burst (Standard FW)', 'colour-burst-standard-fw-vav-092', 'VAV-092', 'கலர் பர்ஸ்ட்', '10 Pcs', 2440.00, 244.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000093', '11111111-0000-0000-0000-000000000012', 'Whistling Dixie (Vadivel FW)', 'whistling-dixie-vadivel-fw-vav-093', 'VAV-093', 'விசிலிங் டிக்ஸி', '5 Pcs', 1200.00, 120.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000094', '11111111-0000-0000-0000-000000000012', 'Ring Ring (Vadivel FW)', 'ring-ring-vadivel-fw-vav-094', 'VAV-094', 'ரிங்ரிங்', '5 Pcs', 2000.00, 200.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000095', '11111111-0000-0000-0000-000000000012', 'Bad Boy (Vadivel FW)', 'bad-boy-vadivel-fw-vav-095', 'VAV-095', 'பேட் பாய்', '3 Pcs', 3300.00, 330.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000096', '11111111-0000-0000-0000-000000000012', 'Autumn Rain (Vadivel FW)', 'autumn-rain-vadivel-fw-vav-096', 'VAV-096', 'ஆட்டம் ரெயின்', '1 Pce', 1400.00, 140.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000097', '11111111-0000-0000-0000-000000000012', 'Winter Rain (Vadivel FW)', 'winter-rain-vadivel-fw-vav-097', 'VAV-097', 'வின்டர் ரெயின்', '1 Pce', 1400.00, 140.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000098', '11111111-0000-0000-0000-000000000012', 'Scooby-Doo (Vadivel FW)', 'scooby-doo-vadivel-fw-vav-098', 'VAV-098', 'ஸ்கூபிடு', '5 Pcs', 1600.00, 160.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000099', '11111111-0000-0000-0000-000000000012', 'Dexter (Vadivel FW)', 'dexter-vadivel-fw-vav-099', 'VAV-099', 'டெக்ஸ்டர்', '5 Pcs', 1600.00, 160.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000100', '11111111-0000-0000-0000-000000000012', 'Popeye (Vadivel FW)', 'popeye-vadivel-fw-vav-100', 'VAV-100', 'பாப்பாயி', '5 Pcs', 1600.00, 160.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000101', '11111111-0000-0000-0000-000000000012', 'Power Puff Girls (Vadivel FW)', 'power-puff-girls-vadivel-fw-vav-101', 'VAV-101', 'பவர் பப்ஃ கேள்ஸ்', '5 Pcs', 1600.00, 160.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000102', '11111111-0000-0000-0000-000000000012', 'Recycle (Vadivel FW)', 'recycle-vadivel-fw-vav-102', 'VAV-102', 'ரீசைகிள்', '5 Pcs', 2000.00, 200.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000103', '11111111-0000-0000-0000-000000000012', 'Fire Egg (Vadivel FW)', 'fire-egg-vadivel-fw-vav-103', 'VAV-103', 'பையர் எக்', '2 Pcs', 1800.00, 180.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000104', '11111111-0000-0000-0000-000000000012', 'Rangoon (Ajantha FW)', 'rangoon-ajantha-fw-vav-104', 'VAV-104', 'ரங்கூன்', '2 Pcs', 2500.00, 250.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000105', '11111111-0000-0000-0000-000000000012', 'Magical Sword (Ajantha FW)', 'magical-sword-ajantha-fw-vav-105', 'VAV-105', 'மெஜிக்கல் ஸ்வார்டு', '2 Pcs', 3200.00, 320.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000106', '11111111-0000-0000-0000-000000000012', 'Galaxy sword (Ajantha FW)', 'galaxy-sword-ajantha-fw-vav-106', 'VAV-106', 'கேலக்ஸி ஸ்வார்டு', '2 Pcs', 3200.00, 320.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000107', '11111111-0000-0000-0000-000000000012', 'Mitico (Ajantha FW)', 'mitico-ajantha-fw-vav-107', 'VAV-107', 'மிடிகோ', '2 Pcs', 2200.00, 220.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000108', '11111111-0000-0000-0000-000000000012', 'Tropical Mushroom (Ajantha FW)', 'tropical-mushroom-ajantha-fw-vav-108', 'VAV-108', 'Tropical Mushroom (Ajantha FW)', '1 Pc', 2500.00, 250.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000109', '11111111-0000-0000-0000-000000000012', 'Smiling Elephant (Ajantha FW)', 'smiling-elephant-ajantha-fw-vav-109', 'VAV-109', 'ஸ்மைலிங் எலிபேன்ட்', '1 Pc', 3350.00, 335.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000110', '11111111-0000-0000-0000-000000000012', 'Lucky Lion (Ajantha FW)', 'lucky-lion-ajantha-fw-vav-110', 'VAV-110', 'லக்கி லையன்', '1 Pc', 3350.00, 335.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000111', '11111111-0000-0000-0000-000000000012', 'Lemon Tree (Ayyan FW)', 'lemon-tree-ayyan-fw-vav-111', 'VAV-111', 'லெமன் ட்ரீ', '1 Pce', 1450.00, 145.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000112', '11111111-0000-0000-0000-000000000012', 'Cocktail (Ayyan FW)', 'cocktail-ayyan-fw-vav-112', 'VAV-112', 'காக் டெய்ல்', '10 Pcs', 650.00, 65.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000113', '11111111-0000-0000-0000-000000000012', 'Jadugar (Ayyan FW)', 'jadugar-ayyan-fw-vav-113', 'VAV-113', 'ஊடுகர்', '5 Pcs', 3350.00, 335.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000114', '11111111-0000-0000-0000-000000000012', 'ManoRajan (Ayyan FW)', 'manorajan-ayyan-fw-vav-114', 'VAV-114', 'மனோராஜன்', '5 Pcs', 3350.00, 335.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000115', '11111111-0000-0000-0000-000000000012', 'Dix Pots', 'dix-pots-vav-115', 'VAV-115', 'டிக்ஸ் பாட்', '5 Pcs', 2500.00, 250.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000116', '11111111-0000-0000-0000-000000000012', 'Kit Kat (Red)', 'kit-kat-red-vav-116', 'VAV-116', 'じゅじ', '5 Pcs', 1750.00, 175.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000117', '11111111-0000-0000-0000-000000000012', 'Tic Tac Mint', 'tic-tac-mint-vav-117', 'VAV-117', 'டிக் டாக் மின்ட', '5 Pcs', 1750.00, 175.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000118', '11111111-0000-0000-0000-000000000012', 'Milky Bar White', 'milky-bar-white-vav-118', 'VAV-118', 'மில்கி பார் வெயிட்', '5 Pcs', 1750.00, 175.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000119', '11111111-0000-0000-0000-000000000012', '5 Star Gold', '5-star-gold-vav-119', 'VAV-119', '5 ஸ்டார் கோல்டு', '5 Pcs', 1750.00, 175.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000120', '11111111-0000-0000-0000-000000000012', 'Dairy Milk', 'dairy-milk-vav-120', 'VAV-120', 'டைரி மில்க்', '5 Pcs', 1750.00, 175.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000121', '11111111-0000-0000-0000-000000000012', 'Germs Colour Mix', 'germs-colour-mix-vav-121', 'VAV-121', 'ஜெம்ஸ் கலர் மிக்ஸ்', '5 Pcs', 1750.00, 175.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000122', '11111111-0000-0000-0000-000000000012', 'Karaoke Night', 'karaoke-night-vav-122', 'VAV-122', 'கரோக்கி நைட்', '1 Pc', 1450.00, 165.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000123', '11111111-0000-0000-0000-000000000012', 'Jazz Music', 'jazz-music-vav-123', 'VAV-123', 'ஜாஸ் மியூசிக்', '1 Pc', 1650.00, 165.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000124', '11111111-0000-0000-0000-000000000012', 'Dr.Pepper', 'drpepper-vav-124', 'VAV-124', 'டாக்டர் பெப்பர்', '1 Pc', 1650.00, 165.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000125', '11111111-0000-0000-0000-000000000012', 'Big Bang', 'big-bang-vav-125', 'VAV-125', 'பிக் பாக்ங்', '1 Pc', 1650.00, 165.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000126', '11111111-0000-0000-0000-000000000012', 'Red Apple', 'red-apple-vav-126', 'VAV-126', 'ரெட் ஆப்பிள்', '5 Pcs', 1700.00, 170.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000127', '11111111-0000-0000-0000-000000000012', 'Carnival Fun Fait', 'carnival-fun-fait-vav-127', 'VAV-127', 'கார்னிவல் ஃபன் பைத்', '5 Pcs', 1700.00, 170.00, NULL, true, true, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000128', '11111111-0000-0000-0000-000000000012', 'Mr.Big', 'mrbig-vav-128', 'VAV-128', 'மிஸ்டர் பிக்', '5 Pcs', 1700.00, 170.00, NULL, true, false, true, 'Medium'),
  ('22222222-0000-0000-0000-000000000129', '11111111-0000-0000-0000-000000000012', 'Tooty Frootiy', 'tooty-frootiy-vav-129', 'VAV-129', 'டூட்டி ஃப்ரூட்டி', '5 Pcs', 1700.00, 170.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000130', '11111111-0000-0000-0000-000000000012', 'Bingo Music', 'bingo-music-vav-130', 'VAV-130', 'பிங்கோ மியூசிக்', '5 Pcs', 1700.00, 170.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000131', '11111111-0000-0000-0000-000000000012', 'Party Time', 'party-time-vav-131', 'VAV-131', 'பார்டி டைம்', '5 Pcs', 1700.00, 170.00, NULL, true, false, true, 'Medium'),
  ('22222222-0000-0000-0000-000000000132', '11111111-0000-0000-0000-000000000012', 'Kulfi', 'kulfi-vav-132', 'VAV-132', 'குல்பி', '3 Pcs', 2450.00, 245.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000133', '11111111-0000-0000-0000-000000000012', 'Hot Cone', 'hot-cone-vav-133', 'VAV-133', 'ஹாட் கோன்', '2 Pcs', 2200.00, 220.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000134', '11111111-0000-0000-0000-000000000012', 'King Version', 'king-version-vav-134', 'VAV-134', 'கிங் வேர்ஷன்', '1 Pc', 2200.00, 220.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000135', '11111111-0000-0000-0000-000000000012', 'Cylinder Smoke', 'cylinder-smoke-vav-135', 'VAV-135', 'சிலிண்டர் ஸ்மோக்', '2 Pcs', 2555.00, 256.00, NULL, true, false, true, 'Medium'),
  ('22222222-0000-0000-0000-000000000136', '11111111-0000-0000-0000-000000000013', '7 Cm Electric Sparklers', '7-cm-electric-sparklers-vav-136', 'VAV-136', '7 செ.மீ எலக்ட்ரிக் கம்பி', '1 Box', 90.00, 9.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000137', '11111111-0000-0000-0000-000000000013', '7 Cm Colour Sparklers', '7-cm-colour-sparklers-vav-137', 'VAV-137', '7 செ.மீ கலர் கம்பி', '1 Box', 110.00, 11.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000138', '11111111-0000-0000-0000-000000000013', '7 Cm Green Sparklers', '7-cm-green-sparklers-vav-138', 'VAV-138', '7 செ.மீ பச்சை கம்பி', '1 Box', 130.00, 13.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000139', '11111111-0000-0000-0000-000000000013', '10 Cm Electric Sparklers', '10-cm-electric-sparklers-vav-139', 'VAV-139', '10 செ.மீ எலக்ட்ரிக் கம்பி', '1 Box', 180.00, 18.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000140', '11111111-0000-0000-0000-000000000013', '10 Cm Colour Sparklers', '10-cm-colour-sparklers-vav-140', 'VAV-140', '10 செ.மீ கலர் கம்பி', '1 Box', 210.00, 21.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000141', '11111111-0000-0000-0000-000000000013', '10 Cm Green Sparklers', '10-cm-green-sparklers-vav-141', 'VAV-141', '10 செ.மீ பச்சை கம்பி', '1 Box', 240.00, 24.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000142', '11111111-0000-0000-0000-000000000013', '12 Cm Electric Sparklers', '12-cm-electric-sparklers-vav-142', 'VAV-142', '12 செ.மீ எலக்ட்ரிக் கம்பி', '1 Box', 270.00, 27.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000143', '11111111-0000-0000-0000-000000000013', '12 Cm Colour Sparklers', '12-cm-colour-sparklers-vav-143', 'VAV-143', '12 செ.மீ கலர் கம்பி', '1 Box', 300.00, 30.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000144', '11111111-0000-0000-0000-000000000013', '12 Cm Green Sparklers', '12-cm-green-sparklers-vav-144', 'VAV-144', '12 செ.மீ பச்சை கம்பி', '1 Box', 340.00, 34.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000145', '11111111-0000-0000-0000-000000000013', '15 Cm Electric Sparklers', '15-cm-electric-sparklers-vav-145', 'VAV-145', '15 செ.மீ எலக்ட்ரிக் கம்பி', '1 Box', 430.00, 43.00, NULL, true, true, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000146', '11111111-0000-0000-0000-000000000013', '15 Cm Colour Sparklers', '15-cm-colour-sparklers-vav-146', 'VAV-146', '15 செ.மீ கலர் கம்பி', '1 Box', 450.00, 45.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000147', '11111111-0000-0000-0000-000000000013', '15 Cm Green Sparklers', '15-cm-green-sparklers-vav-147', 'VAV-147', '15 செ.மீ பச்சை கம்பி', '1 Box', 470.00, 47.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000148', '11111111-0000-0000-0000-000000000013', '30 Cm Electric Sparklers', '30-cm-electric-sparklers-vav-148', 'VAV-148', '30 செ.மீ எலக்ட்ரிக் கம்பி', '1 Box', 430.00, 43.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000149', '11111111-0000-0000-0000-000000000013', '30 Cm Colour Sparklers', '30-cm-colour-sparklers-vav-149', 'VAV-149', '30 செ.மீ கலர் கம்பி', '1 Box', 450.00, 45.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000150', '11111111-0000-0000-0000-000000000013', '30 Cm Green Sparklers', '30-cm-green-sparklers-vav-150', 'VAV-150', '30 செ.மீ பச்சை கம்பி', '1 Box', 470.00, 47.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000151', '11111111-0000-0000-0000-000000000013', '50 Cm Electric Sparklers', '50-cm-electric-sparklers-vav-151', 'VAV-151', '50 செ.மீ எலக்ட்ரிக் கம்பி', '1 Box', 1600.00, 160.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000152', '11111111-0000-0000-0000-000000000013', '50 Cm Colour Sparklers', '50-cm-colour-sparklers-vav-152', 'VAV-152', '50 செ.மீ கலர் கம்பி', '1 Box', 1800.00, 180.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000153', '11111111-0000-0000-0000-000000000013', 'Rotating Umbrella Sparklers', 'rotating-umbrella-sparklers-vav-153', 'VAV-153', 'ரோடேடிங் அம்ப்ரல்லா கம்பி', '1 Box', 2000.00, 200.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000154', '11111111-0000-0000-0000-000000000014', 'Colour Matches', 'colour-matches-vav-154', 'VAV-154', 'கலர் மேட்சஸ்', '1 Box', 1500.00, 150.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000155', '11111111-0000-0000-0000-000000000014', 'Colour Matches (Deluxe)', 'colour-matches-deluxe-vav-155', 'VAV-155', 'கலர் மேட்சஸ் (டீலக்ஸ்)', '1 Box', 2000.00, 200.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000156', '11111111-0000-0000-0000-000000000014', 'Colour Matches 10 In 1(Big)', 'colour-matches-10-in-1big-vav-156', 'VAV-156', 'கலர் மேட்சஸ் 10 இன் 1', '1 Box', 2500.00, 250.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000157', '11111111-0000-0000-0000-000000000014', 'Hunter Gun(with) Ring Caps', 'hunter-gunwith-ring-caps-vav-157', 'VAV-157', 'ஹன்டர் கன் வித் ரிங் கேப்ஸ்', '1 Box', 1500.00, 150.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000158', '11111111-0000-0000-0000-000000000014', 'Snake Serpent (Big)', 'snake-serpent-big-vav-158', 'VAV-158', 'பாம்பு மாத்திரை (பெரியது)', '1 Box', 1000.00, 100.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000159', '11111111-0000-0000-0000-000000000014', 'Electric Stone/Magic Pops', 'electric-stonemagic-pops-vav-159', 'VAV-159', 'எலக்ட்ரிக் ஸ்டோன்/மேஜிக் பாப்ஸ்', '1 Box', 100.00, 10.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000160', '11111111-0000-0000-0000-000000000014', 'Cartoon', 'cartoon-vav-160', 'VAV-160', 'கார்டூன்', '25 Pcs', 700.00, 70.00, NULL, true, false, false, 'Silent'),
  ('22222222-0000-0000-0000-000000000161', '11111111-0000-0000-0000-000000000015', 'Darling Pack 20 Items', 'darling-pack-20-items-vav-161', 'VAV-161', 'டார்லிங் கிப்ட் 20 Items', '1 Box', 330.00, 330.00, NULL, true, true, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000162', '11111111-0000-0000-0000-000000000015', 'Family Pack 25 Items', 'family-pack-25-items-vav-162', 'VAV-162', 'பேமிலி கிப்ட் 25 items', '1 Box', 400.00, 400.00, NULL, true, false, true, 'Medium'),
  ('22222222-0000-0000-0000-000000000163', '11111111-0000-0000-0000-000000000015', 'Golden Pack 30 Items', 'golden-pack-30-items-vav-163', 'VAV-163', 'கோல்டன் கிப்ட் 30 Items', '1 Box', 450.00, 450.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000164', '11111111-0000-0000-0000-000000000015', 'V.I.P. Pack 35 Items', 'vip-pack-35-items-vav-164', 'VAV-164', 'வி.ஐ.பி. கிப்ட் 35 Items', '1 Box', 530.00, 530.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000165', '11111111-0000-0000-0000-000000000015', 'Premium Pack 42 Items', 'premium-pack-42-items-vav-165', 'VAV-165', 'பிரீமியம் கிப்ட் 42 Items', '1 Box', 830.00, 830.00, NULL, true, false, false, 'Medium'),
  ('22222222-0000-0000-0000-000000000166', '11111111-0000-0000-0000-000000000015', 'Diwali Special Pack 50 Items', 'diwali-special-pack-50-items-vav-166', 'VAV-166', 'தீபாவளி ஸ்பெஷல் கிப்ட் 50 Items', '1 Box', 1000.00, 1000.00, NULL, true, true, true, 'Medium');

-- 10.6 SEED INITIAL WAREHOUSE INVENTORY BALANCES (150 STOCK FOR EACH PRODUCT)
INSERT INTO inventory (product_id, available_stock, reserved_stock, safety_threshold, updated_at) VALUES
  ('22222222-0000-0000-0000-000000000001', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000002', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000003', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000004', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000005', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000006', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000007', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000008', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000009', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000010', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000011', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000012', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000013', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000014', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000015', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000016', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000017', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000018', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000019', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000020', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000021', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000022', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000023', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000024', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000025', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000026', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000027', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000028', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000029', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000030', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000031', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000032', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000033', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000034', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000035', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000036', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000037', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000038', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000039', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000040', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000041', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000042', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000043', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000044', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000045', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000046', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000047', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000048', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000049', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000050', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000051', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000052', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000053', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000054', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000055', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000056', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000057', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000058', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000059', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000060', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000061', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000062', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000063', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000064', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000065', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000066', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000067', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000068', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000069', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000070', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000071', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000072', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000073', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000074', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000075', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000076', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000077', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000078', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000079', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000080', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000081', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000082', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000083', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000084', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000085', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000086', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000087', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000088', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000089', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000090', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000091', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000092', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000093', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000094', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000095', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000096', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000097', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000098', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000099', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000100', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000101', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000102', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000103', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000104', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000105', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000106', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000107', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000108', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000109', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000110', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000111', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000112', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000113', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000114', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000115', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000116', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000117', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000118', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000119', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000120', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000121', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000122', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000123', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000124', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000125', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000126', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000127', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000128', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000129', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000130', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000131', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000132', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000133', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000134', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000135', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000136', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000137', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000138', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000139', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000140', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000141', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000142', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000143', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000144', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000145', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000146', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000147', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000148', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000149', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000150', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000151', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000152', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000153', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000154', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000155', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000156', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000157', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000158', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000159', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000160', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000161', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000162', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000163', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000164', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000165', 150, 0, 10, NOW()),
  ('22222222-0000-0000-0000-000000000166', 150, 0, 10, NOW());

-- 10.7 SEED FESTIVAL COMBOS & BUNDLES
INSERT INTO combos (id, name, slug, description, price, mrp, image_url, is_active) VALUES
  ('44444444-0000-0000-0000-000000000001', 'Diwali Family Grand Celebration Pack', 'diwali-family-grand-celebration-pack', 'Complete 25-variety Sivakasi celebration gift box with sparklers, flower pots, rockets, and aerial shots.', 3990.00, 15000.00, NULL, true),
  ('44444444-0000-0000-0000-000000000002', 'Kids Safe & Joyful Sparkle Box', 'kids-safe-joyful-sparkle-box', 'Child-safe low noise gift box with colorful sparklers, ground chakkaras, flower pots, and pencils.', 1890.00, 7500.00, NULL, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO combo_items (combo_id, product_id, quantity) VALUES
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 2),
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000009', 2),
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000013', 2),
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000127', 3),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000009', 1),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000014', 2),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000020', 2),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000127', 3)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- END OF COMPLETE DATABASE SETUP SCRIPT
-- ==============================================================================
