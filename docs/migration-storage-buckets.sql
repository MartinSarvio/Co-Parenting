-- ============================================================================
-- SKALERBARHED: Opret Storage buckets til fotos og dokumenter
-- Kør dette i Supabase SQL Editor
-- ============================================================================
-- Sikker at køre flere gange (DROP IF EXISTS + ON CONFLICT)
-- ============================================================================

-- ── family-photos bucket ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'family-photos',
  'family-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload family photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload family photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'family-photos');

DROP POLICY IF EXISTS "Public read access for family photos" ON storage.objects;
CREATE POLICY "Public read access for family photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'family-photos');

DROP POLICY IF EXISTS "Users can delete family photos" ON storage.objects;
CREATE POLICY "Users can delete family photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'family-photos');


-- ── family-documents bucket ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'family-documents',
  'family-documents',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'family-documents');

DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'family-documents');

DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;
CREATE POLICY "Users can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'family-documents');


-- ── tilbudsaviser bucket ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tilbudsaviser',
  'tilbudsaviser',
  true,
  73400320,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload tilbudsaviser" ON storage.objects;
CREATE POLICY "Authenticated users can upload tilbudsaviser"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tilbudsaviser');

DROP POLICY IF EXISTS "Public read access for tilbudsaviser" ON storage.objects;
CREATE POLICY "Public read access for tilbudsaviser"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'tilbudsaviser');

DROP POLICY IF EXISTS "Users can delete tilbudsaviser" ON storage.objects;
CREATE POLICY "Users can delete tilbudsaviser"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tilbudsaviser');


-- ============================================================================
-- SUPABASE REALTIME: Aktiver replication for kritiske tabeller
-- ============================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
