-- Migration: Add shared custody links table for sharing samværsplan externally
-- Run this in Supabase SQL Editor

-- ── Shared Custody Links ──────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_custody_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  view_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast token lookup (public access path)
CREATE INDEX IF NOT EXISTS idx_shared_custody_links_token
  ON shared_custody_links(token) WHERE is_active = true;

-- Index for household listing
CREATE INDEX IF NOT EXISTS idx_shared_custody_links_household
  ON shared_custody_links(household_id, is_active) WHERE is_active = true;

ALTER TABLE shared_custody_links ENABLE ROW LEVEL SECURITY;

-- Household members can manage their own links
CREATE POLICY "Users can view links in their household"
  ON shared_custody_links FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create links in their household"
  ON shared_custody_links FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can deactivate their own links"
  ON shared_custody_links FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Public read access via token (for the shared view page)
-- Note: This allows anyone with a valid token to read the link metadata.
-- The actual custody plan data should be served by an edge function
-- that fetches plan data separately with service-role key.
CREATE POLICY "Public can view active links by token"
  ON shared_custody_links FOR SELECT
  USING (is_active = true AND expires_at > now());
