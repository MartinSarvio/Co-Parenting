-- ============================================================================
-- DEL 3: FUZZY MATCHING (VALGFRI)
-- Kør dette EFTER Del 1 er kørt succesfuldt.
--
-- Kræver pg_trgm extension. Aktivér først via:
--   Dashboard → Database → Extensions → søg "pg_trgm" → Enable
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gin (product_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_brand_trgm
  ON products USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_product_prices_name_trgm
  ON product_prices USING gin (product_name gin_trgm_ops);

-- Fuzzy match funktion
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
