-- ============================================================================
-- Odiyuki — Web Katalog Aksesoris & Order Notes Generator
-- Supabase Schema, Auto-SKU Trigger, Storage Bucket & RLS Policies
-- ============================================================================

-- 1. Tabel Kategori (Admin bisa tambah kategori sendiri)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,        -- Contoh: 'Keychain', 'Phone Holder'
  prefix TEXT UNIQUE NOT NULL,      -- Contoh: 'KC', 'PH' (2-4 huruf kapital untuk SKU)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Produk
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,         -- Ter-generate otomatis (misal: 'KC-001')
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}', -- Array URL foto untuk carousel detail produk
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Function & Trigger Auto-Generate SKU saat Insert Produk Baru
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
  cat_prefix TEXT;
  next_num INTEGER;
BEGIN
  -- Ambil prefix dari kategori yang dipilih
  SELECT prefix INTO cat_prefix FROM categories WHERE id = NEW.category_id;

  IF cat_prefix IS NULL THEN
    RAISE EXCEPTION 'Kategori tidak ditemukan untuk category_id: %', NEW.category_id;
  END IF;

  -- Hitung urutan berikutnya berdasarkan prefix tersebut
  SELECT COALESCE(MAX(CAST(SPLIT_PART(sku, '-', 2) AS INTEGER)), 0) + 1
  INTO next_num
  FROM products
  WHERE sku LIKE cat_prefix || '-%';

  -- Format menjadi PREFIX-001 (3 digit padding)
  NEW.sku := cat_prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_sku ON products;
CREATE TRIGGER trg_auto_sku
BEFORE INSERT ON products
FOR EACH ROW
WHEN (NEW.sku IS NULL OR NEW.sku = '')
EXECUTE FUNCTION generate_product_sku();

-- 4. Permissions (GRANT) & Row Level Security (RLS) untuk tabel categories & products
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE categories, products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE categories, products TO authenticated;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public (anon & authenticated) boleh membaca kategori & produk
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products"
ON products FOR SELECT
TO anon, authenticated
USING (true);

-- Hanya Admin (authenticated) yang boleh INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Authenticated can insert categories" ON categories;
CREATE POLICY "Authenticated can insert categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update categories" ON categories;
CREATE POLICY "Authenticated can update categories"
ON categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete categories" ON categories;
CREATE POLICY "Authenticated can delete categories"
ON categories FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert products" ON products;
CREATE POLICY "Authenticated can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update products" ON products;
CREATE POLICY "Authenticated can update products"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete products" ON products;
CREATE POLICY "Authenticated can delete products"
ON products FOR DELETE
TO authenticated
USING (true);

-- 5. Storage Bucket 'product-images' (Public untuk CORS html-to-image)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
CREATE POLICY "Authenticated can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;
CREATE POLICY "Authenticated can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 6. Seed Kategori Awal (Opsional)
INSERT INTO categories (name, prefix) VALUES
  ('Keychain', 'KC'),
  ('Phone Holder', 'PH'),
  ('Strap HP', 'ST'),
  ('Pin & Brooch', 'PB')
ON CONFLICT (name) DO NOTHING;

-- 7. Tabel Pengaturan Toko (Nomor WhatsApp Owner Dinamis)
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  owner_wa_phone TEXT NOT NULL,
  owner_wa_display TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON TABLE store_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE store_settings TO authenticated;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view store settings" ON store_settings;
CREATE POLICY "Public can view store settings"
ON store_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert store settings" ON store_settings;
CREATE POLICY "Authenticated can insert store settings"
ON store_settings FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update store settings" ON store_settings;
CREATE POLICY "Authenticated can update store settings"
ON store_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO store_settings (id, owner_wa_phone, owner_wa_display)
VALUES ('default', '6285850757148', '0858-5075-7148')
ON CONFLICT (id) DO UPDATE SET
  owner_wa_phone = EXCLUDED.owner_wa_phone,
  owner_wa_display = EXCLUDED.owner_wa_display;
