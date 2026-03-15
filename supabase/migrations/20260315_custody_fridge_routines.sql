-- ============================================================
-- Custody Plans, Fridge Items, Routine Items & Logs + RLS
-- Kør dette i Supabase SQL Editor
-- ============================================================

-- ─── Custody Plans ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custody_plans (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pattern TEXT,
  start_date TEXT,
  swap_day INTEGER,
  swap_time TEXT,
  swap_location JSONB,
  parent1_weeks INTEGER,
  parent2_weeks INTEGER,
  parent1_days INTEGER[] DEFAULT '{}',
  parent2_days INTEGER[] DEFAULT '{}',
  weekly_schedule JSONB,
  custom_week_config JSONB,
  custom_schedule JSONB,
  supervised_config JSONB,
  holidays JSONB,
  special_days JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custody_plans_household ON custody_plans(household_id);
CREATE INDEX IF NOT EXISTS idx_custody_plans_child ON custody_plans(child_id);

ALTER TABLE custody_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custody_plans_select" ON custody_plans FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "custody_plans_insert" ON custody_plans FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "custody_plans_update" ON custody_plans FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "custody_plans_delete" ON custody_plans FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));


-- ─── Fridge Items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fridge_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  nutrition_per_100g JSONB,
  allergens TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fridge_items_household ON fridge_items(household_id);

ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fridge_items_select" ON fridge_items FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "fridge_items_insert" ON fridge_items FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "fridge_items_update" ON fridge_items FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "fridge_items_delete" ON fridge_items FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));


-- ─── Routine Items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routine_items (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT,
  "order" INTEGER DEFAULT 0,
  meal_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_items_child ON routine_items(child_id);

ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_items_select" ON routine_items FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "routine_items_insert" ON routine_items FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "routine_items_update" ON routine_items FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "routine_items_delete" ON routine_items FOR DELETE
  USING (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));


-- ─── Routine Logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routine_logs (
  id TEXT PRIMARY KEY,
  routine_item_id TEXT NOT NULL REFERENCES routine_items(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  time TEXT,
  note TEXT,
  linked_food_log_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_logs_item ON routine_logs(routine_item_id);
CREATE INDEX IF NOT EXISTS idx_routine_logs_child_date ON routine_logs(child_id, date DESC);

ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_logs_select" ON routine_logs FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "routine_logs_insert" ON routine_logs FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "routine_logs_update" ON routine_logs FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "routine_logs_delete" ON routine_logs FOR DELETE
  USING (child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  ));
