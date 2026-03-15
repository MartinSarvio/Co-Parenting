-- Udvid products-tabellen med ingredienser, spor af allergener og portionsstørrelser
-- Kør dette i Supabase SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS traces TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_text TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS serving_size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS serving_quantity NUMERIC;
