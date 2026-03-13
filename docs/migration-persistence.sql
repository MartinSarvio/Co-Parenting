-- Migration: Add persistence tables for photos, fridge, wish items, budget goals
-- Run this in Supabase SQL Editor

-- ── Family Photos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_photos (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMPTZ NOT NULL,
  added_by UUID NOT NULL REFERENCES profiles(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE family_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos in their household"
  ON family_photos FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert photos in their household"
  ON family_photos FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own photos"
  ON family_photos FOR DELETE
  USING (added_by = auth.uid());

-- ── Fridge Items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fridge_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  nutrition_per_100g JSONB
);

ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fridge items in their household"
  ON fridge_items FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert fridge items in their household"
  ON fridge_items FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update fridge items in their household"
  ON fridge_items FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete fridge items in their household"
  ON fridge_items FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

-- ── Wish Items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wish_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price_estimate NUMERIC,
  link TEXT,
  image_url TEXT,
  description TEXT,
  child_id TEXT NOT NULL,
  added_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'wanted' CHECK (status IN ('wanted', 'bought')),
  bought_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wish_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view wish items in their household"
  ON wish_items FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert wish items in their household"
  ON wish_items FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update wish items in their household"
  ON wish_items FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete wish items in their household"
  ON wish_items FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

-- ── Budget Goals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_amount NUMERIC NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, category)
);

ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget goals in their household"
  ON budget_goals FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert budget goals in their household"
  ON budget_goals FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update budget goals in their household"
  ON budget_goals FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete budget goals in their household"
  ON budget_goals FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

-- ── Child Verification (for dobbelt fødselsdato-bekræftelse) ──
ALTER TABLE children ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';
-- 'verified' = created by parent1 (auto-verified)
-- 'pending_verification' = waiting for parent2 to confirm

ALTER TABLE household_members ADD COLUMN IF NOT EXISTS child_verification_attempts INTEGER DEFAULT 0;
ALTER TABLE household_members ADD COLUMN IF NOT EXISTS child_verified BOOLEAN DEFAULT false;
