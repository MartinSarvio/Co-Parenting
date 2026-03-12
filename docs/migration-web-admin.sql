-- ============================================================================
-- WEB ADMIN: Tilføj manglende kolonner til affiliate_links og pdf_import_items
-- Kør dette i Supabase SQL Editor
-- ============================================================================
-- Sikker at køre flere gange (IF NOT EXISTS)
-- ============================================================================

-- ── affiliate_links: banner + source felter ──────────────────────────────────
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS banner_position_y INTEGER DEFAULT 50;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS source_url TEXT;

-- ── pdf_import_items: produktbillede fra tilbudsavis ─────────────────────────
ALTER TABLE pdf_import_items ADD COLUMN IF NOT EXISTS image_url TEXT;
