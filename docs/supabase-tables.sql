-- ============================================================================
-- Analyse + Tilbuds-admin: Supabase SQL
-- Kør dette i Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Analytics Events (letvægts event-tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,       -- 'page_view' | 'product_click' | 'link_redirect' | 'news_view' | 'forum_post'
  user_id UUID,                   -- nullable
  target_id TEXT,                 -- product/article/group id
  target_type TEXT,               -- 'product' | 'article' | 'forum_group' | 'offer' | 'flyer'
  page TEXT,                      -- 'nyheder' | 'tilbud' | 'forum' | 'tilbudsavis'
  metadata JSONB DEFAULT '{}',    -- flexible extra data
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_target ON analytics_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON analytics_events(page);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 2. Affiliate Links
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  store TEXT,                     -- 'Bilka', 'Netto', etc.
  partner TEXT,                   -- partner/network name
  category TEXT,                  -- 'Elektronik', 'Mejeri', etc.
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage affiliate_links"
  ON affiliate_links FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 3. Affiliate Clicks (klik-log)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  product_id TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link ON affiliate_clicks(affiliate_link_id);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert affiliate_clicks"
  ON affiliate_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read affiliate_clicks"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 4. PDF Import Batches (upload-historik)
CREATE TABLE IF NOT EXISTS pdf_import_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT,                  -- Supabase Storage path
  store TEXT,
  valid_from DATE,
  valid_until DATE,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'preview' | 'confirmed' | 'failed'
  total_products INTEGER DEFAULT 0,
  confirmed_products INTEGER DEFAULT 0,
  low_confidence_count INTEGER DEFAULT 0,
  error_message TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE pdf_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pdf_import_batches"
  ON pdf_import_batches FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 5. PDF Import Items (ekstraherede produkter - staging)
CREATE TABLE IF NOT EXISTS pdf_import_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES pdf_import_batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price TEXT,
  original_price TEXT,
  discount TEXT,
  category TEXT,
  unit TEXT,
  image_data TEXT,                -- base64 or URL
  confidence NUMERIC(3,2),       -- 0.00 to 1.00
  is_confirmed BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  admin_notes TEXT,
  raw_extraction JSONB,          -- raw AI output
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdf_import_items_batch ON pdf_import_items(batch_id);

ALTER TABLE pdf_import_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pdf_import_items"
  ON pdf_import_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 6. Supabase Storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('tilbudsaviser', 'tilbudsaviser', false);

-- Storage policies for tilbudsaviser bucket
CREATE POLICY "Admin can upload tilbudsaviser" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tilbudsaviser'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin can read tilbudsaviser" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'tilbudsaviser'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- 7. News Articles (admin-managed nyheder)
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  full_text TEXT,
  source TEXT,
  date TEXT,
  image TEXT,
  url TEXT,
  is_published BOOLEAN DEFAULT true,
  is_scraped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_news_articles_created ON news_articles(created_at);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published news"
  ON news_articles FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage news"
  ON news_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
