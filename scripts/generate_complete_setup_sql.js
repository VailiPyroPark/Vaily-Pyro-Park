const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const csvPath = path.join(__dirname, '../public/products.csv');
const outputPath = path.join(__dirname, '../supabase/complete_database_setup.sql');

const csvContent = fs.readFileSync(csvPath, 'utf8');
const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

// 15 Categories in order
const categoryList = [
  { name: 'ONE SOUND CRACKERS', slug: 'one-sound-crackers', icon: 'Volume2', desc: 'Classic Single Sound Sivakasi Crackers', sound: 'High' },
  { name: 'FLOWER POTS', slug: 'flower-pots', icon: 'Flame', desc: 'Dazzling Sparkling Flower Pots Collection', sound: 'Low' },
  { name: 'GROUND CHAKKAR', slug: 'ground-chakkar', icon: 'RotateCw', desc: 'High Speed Spinning Ground Chakkaras', sound: 'Low' },
  { name: 'TWINKLING STARS & PENCILS', slug: 'twinkling-stars-pencils', icon: 'Sparkles', desc: 'Twinkling Stars & Colorful Sparkle Pencils', sound: 'Silent' },
  { name: 'ROCKETS', slug: 'rockets', icon: 'Rocket', desc: 'High Flying Sound and Whistling Sky Rockets', sound: 'High' },
  { name: 'BOMBS', slug: 'bombs', icon: 'Volume2', desc: 'High Intensity Hydro, Deluxe & Paper Bombs', sound: 'High' },
  { name: 'BIJILI CRACKERS', slug: 'bijili-crackers', icon: 'Zap', desc: 'Traditional Red & Striped Bijili Crackers', sound: 'Medium' },
  { name: 'FOUNTAIN & VARIETIES', slug: 'fountain-varieties', icon: 'Sparkles', desc: 'Colorful Fountains, Drones & Novelty Items', sound: 'Medium' },
  { name: 'FANCY CRACKERS', slug: 'fancy-crackers', icon: 'Sparkles', desc: 'Spectacular Night Aerial Fancy Fireworks', sound: 'Medium' },
  { name: 'SILVER', slug: 'silver', icon: 'Sparkles', desc: 'Premium Silver Celebration Fireworks Series', sound: 'High' },
  { name: 'GOLD', slug: 'gold', icon: 'Sparkles', desc: 'Exclusive Gold Series Royal Sivakasi Fireworks', sound: 'High' },
  { name: 'WOW COLLECTION', slug: 'wow-collection', icon: 'Sparkles', desc: 'Mega Multi-Shot Cakes & Sky Burst Showstoppers', sound: 'Medium' },
  { name: 'SPARKLERS', slug: 'sparklers', icon: 'Sparkles', desc: 'Child-Safe Electric, Color & Mega Sparklers', sound: 'Silent' },
  { name: 'COLOUR MATCHES', slug: 'colour-matches', icon: 'Flame', desc: 'Novelty Color Flame Matches & Safe Lights', sound: 'Silent' },
  { name: 'GIFT BOXES', slug: 'gift-boxes', icon: 'Gift', desc: 'Grand Family Celebration & Kids Festival Gift Boxes', sound: 'Medium' },
];

const categoryIdMap = {};
categoryList.forEach((cat, idx) => {
  const num = String(idx + 1).padStart(12, '0');
  categoryIdMap[cat.name] = `11111111-0000-0000-0000-${num}`;
});

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate Categories SQL Values
const categorySqlValues = categoryList.map((cat, idx) => {
  const catId = categoryIdMap[cat.name];
  return `  ('${catId}', ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.desc)}, ${escapeSql(cat.icon)}, ${idx + 1}, true)`;
}).join(',\n');

// Featured and best-seller SKU list
const featuredSkus = new Set(['VAV-001', 'VAV-004', 'VAV-009', 'VAV-013', 'VAV-020', 'VAV-026', 'VAV-031', 'VAV-041', 'VAV-043', 'VAV-049', 'VAV-060', 'VAV-083', 'VAV-127', 'VAV-145', 'VAV-161', 'VAV-166']);
const bestSellerSkus = new Set(['VAV-001', 'VAV-003', 'VAV-008', 'VAV-010', 'VAV-014', 'VAV-022', 'VAV-032', 'VAV-037', 'VAV-042', 'VAV-051', 'VAV-084', 'VAV-128', 'VAV-131', 'VAV-135', 'VAV-162', 'VAV-166']);

// Generate Products & Inventory SQL Values
const productSqlValues = [];
const inventorySqlValues = [];

parsed.data.forEach((row, idx) => {
  const num = String(idx + 1).padStart(12, '0');
  const productId = `22222222-0000-0000-0000-${num}`;
  const categoryId = categoryIdMap[row.category];
  
  if (!categoryId) {
    console.error(`Unknown category '${row.category}' at row ${idx + 1}`);
    return;
  }

  const cleanName = row.name.trim();
  const sku = row.sku.trim();
  const packSize = row.pack_size ? row.pack_size.trim() : '1 Box';
  const mrp = parseFloat(row.mrp) || 0;
  const sellingPrice = parseFloat(row.selling_price) || 0;
  const description = row.description ? row.description.trim() : cleanName;
  
  // Clean, unique slug combining name slug and SKU
  const slug = `${slugify(cleanName)}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  
  // Sound level lookup
  const catObj = categoryList.find(c => c.name === row.category);
  const soundLevel = catObj ? catObj.sound : 'Medium';
  
  const isFeatured = featuredSkus.has(sku);
  const isBestSeller = bestSellerSkus.has(sku);

  productSqlValues.push(
    `  ('${productId}', '${categoryId}', ${escapeSql(cleanName)}, ${escapeSql(slug)}, ${escapeSql(sku)}, ${escapeSql(description)}, ${escapeSql(packSize)}, ${mrp.toFixed(2)}, ${sellingPrice.toFixed(2)}, NULL, true, ${isFeatured}, ${isBestSeller}, ${escapeSql(soundLevel)})`
  );

  inventorySqlValues.push(
    `  ('${productId}', 150, 0, 10, NOW())`
  );
});

const fullSql = `-- ==============================================================================
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
${categorySqlValues};

-- 10.5 SEED COMPLETE 166-PRODUCT OFFICIAL CATALOG (FROM public/products.csv)
INSERT INTO products (id, category_id, name, slug, sku, description, pack_size, mrp, selling_price, image_url, is_active, is_featured, is_best_seller, sound_level) VALUES
${productSqlValues.join(',\n')};

-- 10.6 SEED INITIAL WAREHOUSE INVENTORY BALANCES (150 STOCK FOR EACH PRODUCT)
INSERT INTO inventory (product_id, available_stock, reserved_stock, safety_threshold, updated_at) VALUES
${inventorySqlValues.join(',\n')};

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
`;

fs.writeFileSync(outputPath, fullSql, 'utf8');
console.log(`Generated complete_database_setup.sql successfully! Total Products: ${parsed.data.length}, Output Size: ${fullSql.length} bytes.`);
