-- Add missing columns to affiliate_links table
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS store text;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS partner text;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS banner_image text;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS banner_position_y integer DEFAULT 50;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0;

-- Create tilbudsaviser storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('tilbudsaviser', 'tilbudsaviser', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tilbudsaviser bucket
DO $$
BEGIN
  CREATE POLICY "Allow authenticated uploads to tilbudsaviser"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tilbudsaviser');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow public read from tilbudsaviser"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'tilbudsaviser');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for affiliate_links
DO $$
BEGIN
  CREATE POLICY "Allow authenticated full access to affiliate_links"
  ON affiliate_links FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for pdf_import_batches
DO $$
BEGIN
  CREATE POLICY "Allow authenticated full access to pdf_import_batches"
  ON pdf_import_batches FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for pdf_import_items
DO $$
BEGIN
  CREATE POLICY "Allow authenticated full access to pdf_import_items"
  ON pdf_import_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Also allow anon to read affiliate_links (for public display)
DO $$
BEGIN
  CREATE POLICY "Allow anon read affiliate_links"
  ON affiliate_links FOR SELECT TO anon
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
