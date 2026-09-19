-- ==============================================================================
-- Migration: Create bills and bill_items tables for Counter Billing & POS
-- File: supabase/migrations/20260919_create_bills_table.sql
-- ==============================================================================

-- 1. Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL DEFAULT 'Direct Warehouse Pickup',
    city VARCHAR(100) NOT NULL DEFAULT 'Sivakasi',
    state VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
    pincode VARCHAR(20) NOT NULL DEFAULT '626123',
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    is_paid BOOLEAN DEFAULT true,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10, 2) NOT NULL,
    pack_size VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create sequential bill number generator sequence & function
CREATE SEQUENCE IF NOT EXISTS bill_seq START 1001;

CREATE OR REPLACE FUNCTION next_bill_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BILL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('bill_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 5. High-speed performance indexes
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_customer_mobile ON bills(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_bills_is_paid ON bills(is_paid);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_product_id ON bill_items(product_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- 7. Drop older policies if re-running
DROP POLICY IF EXISTS "Allow read bills" ON bills;
DROP POLICY IF EXISTS "Allow insert bills" ON bills;
DROP POLICY IF EXISTS "Allow update bills" ON bills;
DROP POLICY IF EXISTS "Allow delete bills" ON bills;

DROP POLICY IF EXISTS "Allow read bill_items" ON bill_items;
DROP POLICY IF EXISTS "Allow insert bill_items" ON bill_items;
DROP POLICY IF EXISTS "Allow update bill_items" ON bill_items;
DROP POLICY IF EXISTS "Allow delete bill_items" ON bill_items;

-- 8. Create permissive RLS policies for seamless counter operation
CREATE POLICY "Allow read bills" ON bills FOR SELECT USING (true);
CREATE POLICY "Allow insert bills" ON bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update bills" ON bills FOR UPDATE USING (true);
CREATE POLICY "Allow delete bills" ON bills FOR DELETE USING (true);

CREATE POLICY "Allow read bill_items" ON bill_items FOR SELECT USING (true);
CREATE POLICY "Allow insert bill_items" ON bill_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update bill_items" ON bill_items FOR UPDATE USING (true);
CREATE POLICY "Allow delete bill_items" ON bill_items FOR DELETE USING (true);
