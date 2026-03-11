-- ============================================================================
-- Open Food Facts + Prishistorik: Supabase SQL
-- Kør dette i Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Forudsætter: supabase-tables.sql er allerede kørt (pdf_import_batches, profiles)
--
-- VIGTIGT: Kør Del 1 først. Kør derefter Del 2 separat.
--          Hvis du vil bruge fuzzy matching, aktivér pg_trgm via
--          Dashboard → Database → Extensions → søg "pg_trgm" → Enable
--          og kør derefter Del 3.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- DEL 1: TABELLER + INDEXES + RLS
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Products (lokal kopi af Open Food Facts data)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode         TEXT NOT NULL,                    -- EAN-13 stregkode
  product_name    TEXT NOT NULL,                    -- dansk navn foretrukket
  brand           TEXT,                             -- mærke/brand
  categories      TEXT[] DEFAULT '{}',              -- produktkategorier
  nutriscore_grade CHAR(1),                         -- a, b, c, d eller e
  nova_group      SMALLINT,                         -- 1-4 (forarbejdningsgrad)
  energy_kcal_100g NUMERIC(8,2),                    -- kalorier pr. 100g
  fat_100g        NUMERIC(8,2),
  saturated_fat_100g NUMERIC(8,2),
  carbohydrates_100g NUMERIC(8,2),
  sugars_100g     NUMERIC(8,2),
  fiber_100g      NUMERIC(8,2),
  proteins_100g   NUMERIC(8,2),
  salt_100g       NUMERIC(8,2),
  allergens       TEXT[] DEFAULT '{}',              -- fx '{en:milk,en:gluten}'
  image_url       TEXT,                             -- produktbillede-URL
  quantity        TEXT,                             -- pakningsstørrelse, fx '250g'
  off_updated_at  TIMESTAMPTZ,                      -- sidst opdateret i OFF
  synced_at       TIMESTAMPTZ,                      -- sidst synkroniseret fra OFF
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT products_barcode_unique UNIQUE (barcode)
);

CREATE INDEX IF NOT EXISTS idx_products_name
  ON products(product_name);

CREATE INDEX IF NOT EXISTS idx_products_nutriscore
  ON products(nutriscore_grade);

CREATE INDEX IF NOT EXISTS idx_products_brand
  ON products(brand);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 2. Product Prices (prishistorik fra tilbudsaviser)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_prices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  barcode         TEXT,                             -- EAN-13 for hurtig lookup
  product_name    TEXT,                             -- kopi fra tilbudsavis (til matching)
  price           NUMERIC(10,2) NOT NULL,           -- tilbudspris i DKK
  original_price  NUMERIC(10,2),                    -- normalpris (hvis tilgængelig)
  store           TEXT NOT NULL,                    -- butikskæde (Netto, Føtex, etc.)
  source          TEXT,                             -- PDF-filnavn eller 'manual'
  batch_id        UUID REFERENCES pdf_import_batches(id) ON DELETE SET NULL,
  valid_from      DATE,                             -- tilbud gældende fra
  valid_to        DATE,                             -- tilbud gældende til
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product
  ON product_prices(product_id);

CREATE INDEX IF NOT EXISTS idx_product_prices_barcode
  ON product_prices(barcode);

CREATE INDEX IF NOT EXISTS idx_product_prices_store
  ON product_prices(store);

CREATE INDEX IF NOT EXISTS idx_product_prices_validity
  ON product_prices(valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_product_prices_created
  ON product_prices(created_at);

ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product_prices"
  ON product_prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert product_prices"
  ON product_prices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update product_prices"
  ON product_prices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete product_prices"
  ON product_prices FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 3. Product Clicks (event-tracking for produktinteraktioner)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_clicks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,                    -- 'click' | 'redirect' | 'view'
  destination_url TEXT,                             -- affiliate/butik-URL (ved redirect)
  user_id         UUID,                             -- bruger (hvis logget ind)
  metadata        JSONB DEFAULT '{}',               -- fleksibel ekstra data
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_clicks_product
  ON product_clicks(product_id);

CREATE INDEX IF NOT EXISTS idx_product_clicks_type
  ON product_clicks(event_type);

CREATE INDEX IF NOT EXISTS idx_product_clicks_created
  ON product_clicks(created_at);

CREATE INDEX IF NOT EXISTS idx_product_clicks_user
  ON product_clicks(user_id);

ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert product_clicks"
  ON product_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read product_clicks"
  ON product_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- ════════════════════════════════════════════════════════════════════════════
-- DEL 2: HJÆLPEFUNKTIONER
-- Kør dette EFTER Del 1 er kørt succesfuldt.
-- ════════════════════════════════════════════════════════════════════════════

-- Prishistorik for ét produkt (til sparkline UI)
-- Brug: SELECT * FROM get_price_history('product-uuid', 6);
CREATE OR REPLACE FUNCTION get_price_history(
  p_product_id UUID,
  p_months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
  out_price NUMERIC,
  out_original_price NUMERIC,
  out_store TEXT,
  out_valid_from DATE,
  out_valid_to DATE,
  out_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.price,
    pp.original_price,
    pp.store,
    pp.valid_from,
    pp.valid_to,
    pp.created_at
  FROM product_prices pp
  WHERE pp.product_id = p_product_id
    AND pp.created_at >= now() - (p_months_back || ' months')::INTERVAL
  ORDER BY pp.valid_from ASC NULLS LAST, pp.created_at ASC;
END;
$$;

-- Prisoversigt for ét produkt (laveste, gennemsnit, antal datapunkter)
-- Brug: SELECT * FROM get_price_summary('product-uuid');
CREATE OR REPLACE FUNCTION get_price_summary(p_product_id UUID)
RETURNS TABLE (
  out_lowest_price NUMERIC,
  out_lowest_price_store TEXT,
  out_average_price NUMERIC,
  out_price_count BIGINT,
  out_latest_price NUMERIC,
  out_latest_store TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      MIN(pp.price) AS min_price,
      AVG(pp.price)::NUMERIC(10,2) AS avg_price,
      COUNT(*) AS cnt
    FROM product_prices pp
    WHERE pp.product_id = p_product_id
  ),
  lowest AS (
    SELECT pp.store AS low_store
    FROM product_prices pp
    WHERE pp.product_id = p_product_id
    ORDER BY pp.price ASC, pp.created_at DESC
    LIMIT 1
  ),
  latest AS (
    SELECT pp.price AS lat_price, pp.store AS lat_store
    FROM product_prices pp
    WHERE pp.product_id = p_product_id
    ORDER BY pp.created_at DESC
    LIMIT 1
  )
  SELECT
    s.min_price,
    l.low_store,
    s.avg_price,
    s.cnt,
    lt.lat_price,
    lt.lat_store
  FROM stats s
  LEFT JOIN lowest l ON true
  LEFT JOIN latest lt ON true;
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- DEL 3: FUZZY MATCHING (VALGFRI)
-- Kræver pg_trgm extension. Aktivér først via:
--   Dashboard → Database → Extensions → søg "pg_trgm" → Enable
-- Kør derefter denne del.
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN-indexes for fuzzy text matching
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gin (product_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_brand_trgm
  ON products USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_product_prices_name_trgm
  ON product_prices USING gin (product_name gin_trgm_ops);

-- Fuzzy match funktion
-- Brug: SELECT * FROM match_product_by_name('Lurpak smør', 0.3);
CREATE OR REPLACE FUNCTION match_product_by_name(
  p_search_name TEXT,
  p_threshold NUMERIC DEFAULT 0.3
)
RETURNS TABLE (
  out_id UUID,
  out_barcode TEXT,
  out_product_name TEXT,
  out_brand TEXT,
  out_similarity NUMERIC
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.barcode,
    p.product_name,
    p.brand,
    similarity(p.product_name, p_search_name)::NUMERIC
  FROM products p
  WHERE similarity(p.product_name, p_search_name) > p_threshold
  ORDER BY similarity(p.product_name, p_search_name) DESC
  LIMIT 10;
END;
$$;
