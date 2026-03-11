-- ============================================================================
-- DEL 1: TABELLER + INDEXES + RLS
-- Kør dette i Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- VIGTIGT: Opret en NY query-tab (+) og indsæt dette indhold!
-- ============================================================================

-- Ryd op fra evt. tidligere forsøg (drop i omvendt rækkefølge pga. FK)
DROP TABLE IF EXISTS product_clicks CASCADE;
DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 1. Products (lokal kopi af Open Food Facts data)
CREATE TABLE products (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode         TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  brand           TEXT,
  categories      TEXT[] DEFAULT '{}',
  nutriscore_grade CHAR(1),
  nova_group      SMALLINT,
  energy_kcal_100g NUMERIC(8,2),
  fat_100g        NUMERIC(8,2),
  saturated_fat_100g NUMERIC(8,2),
  carbohydrates_100g NUMERIC(8,2),
  sugars_100g     NUMERIC(8,2),
  fiber_100g      NUMERIC(8,2),
  proteins_100g   NUMERIC(8,2),
  salt_100g       NUMERIC(8,2),
  allergens       TEXT[] DEFAULT '{}',
  image_url       TEXT,
  quantity        TEXT,
  off_updated_at  TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT products_barcode_unique UNIQUE (barcode)
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_nutriscore ON products(nutriscore_grade);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- 2. Product Prices (prishistorik fra tilbudsaviser)
CREATE TABLE product_prices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  barcode         TEXT,
  product_name    TEXT,
  price           NUMERIC(10,2) NOT NULL,
  original_price  NUMERIC(10,2),
  store           TEXT NOT NULL,
  source          TEXT,
  batch_id        UUID,
  valid_from      DATE,
  valid_to        DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_barcode ON product_prices(barcode);
CREATE INDEX IF NOT EXISTS idx_product_prices_store ON product_prices(store);
CREATE INDEX IF NOT EXISTS idx_product_prices_validity ON product_prices(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_product_prices_created ON product_prices(created_at);

ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product_prices"
  ON product_prices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert product_prices"
  ON product_prices FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update product_prices"
  ON product_prices FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete product_prices"
  ON product_prices FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- 3. Product Clicks (event-tracking)
CREATE TABLE product_clicks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,
  destination_url TEXT,
  user_id         UUID,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_clicks_product ON product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_type ON product_clicks(event_type);
CREATE INDEX IF NOT EXISTS idx_product_clicks_created ON product_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_product_clicks_user ON product_clicks(user_id);

ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert product_clicks"
  ON product_clicks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can read product_clicks"
  ON product_clicks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
