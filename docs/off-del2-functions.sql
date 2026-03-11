-- ============================================================================
-- DEL 2: HJÆLPEFUNKTIONER
-- Kør dette EFTER Del 1 er kørt succesfuldt.
-- ============================================================================

-- Prishistorik for ét produkt (til sparkline UI)
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
