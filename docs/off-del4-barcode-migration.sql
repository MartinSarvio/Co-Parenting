-- ============================================================================
-- DEL 4: Tilføj barcode-kolonne til pdf_import_items
-- Kør dette i Supabase SQL Editor
-- ============================================================================

ALTER TABLE pdf_import_items ADD COLUMN IF NOT EXISTS barcode TEXT;
