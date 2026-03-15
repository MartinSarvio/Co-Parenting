-- ============================================================
-- Supabase Migration: Co-Parenting App
-- Konverteret fra Prisma schema
-- ============================================================

-- Enable UUID extension (Supabase har det allerede, men for en sikkerheds skyld)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for CUID-lignende IDs
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS text AS $$
BEGIN
  RETURN 'c' || encode(gen_random_bytes(12), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ─── Profiles (udvidet brugerdata, linket til auth.users) ───
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT 'warm',
  phone TEXT,
  role TEXT DEFAULT 'parent',
  professional_type TEXT,
  organization TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Device Tokens ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_tokens (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);

-- ─── Households ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  family_mode TEXT DEFAULT 'co_parenting',
  case_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Household Members ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'parent',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, household_id)
);

-- ─── Children ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  birth_date TIMESTAMPTZ NOT NULL,
  avatar TEXT,
  parent1_id UUID NOT NULL REFERENCES profiles(id),
  parent2_id UUID NOT NULL REFERENCES profiles(id),
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  institution_name TEXT,
  institution_type TEXT,
  allergies TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Institutions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  opening_hours TEXT,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Custody Plans ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custody_plans (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  swap_day INT DEFAULT 4,
  swap_time TEXT DEFAULT '18:00',
  parent1_days INT[] DEFAULT '{}',
  parent2_days INT[] DEFAULT '{}',
  weekly_schedule JSONB,
  custom_week_config JSONB,
  custom_schedule JSONB,
  holidays JSONB,
  special_days JSONB,
  agreement_date TIMESTAMPTZ,
  agreement_valid_until TIMESTAMPTZ,
  agreement_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Calendar Events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  child_id TEXT REFERENCES children(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  location TEXT,
  assigned_to TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  deadline TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  category TEXT DEFAULT 'general',
  is_recurring BOOLEAN DEFAULT FALSE,
  planned_weekday INT,
  area TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Shopping Items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  quantity TEXT,
  purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID,
  purchased_at TIMESTAMPTZ,
  added_by UUID NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Meal Plans ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  recipe JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Message Threads ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  title TEXT NOT NULL,
  participants TEXT[] DEFAULT '{}',
  child_id TEXT,
  unread_count INT DEFAULT 0,
  deleted_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  read_by TEXT[] DEFAULT '{}',
  deleted_by TEXT[] DEFAULT '{}',
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Expenses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  title TEXT NOT NULL,
  description TEXT,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'DKK',
  category TEXT NOT NULL,
  paid_by UUID NOT NULL REFERENCES profiles(id),
  split_with TEXT[] DEFAULT '{}',
  split_amounts JSONB DEFAULT '{}',
  split_type TEXT DEFAULT 'equal',
  date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  receipt_url TEXT,
  approved_by TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Documents ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  shared_with TEXT[] DEFAULT '{}',
  is_official BOOLEAN DEFAULT FALSE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Milestones ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  added_by UUID NOT NULL,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Family Photos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_photos (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMPTZ NOT NULL,
  added_by UUID NOT NULL REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Diary Entries ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diary_entries (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  mood TEXT NOT NULL,
  sleep TEXT NOT NULL,
  appetite TEXT NOT NULL,
  note TEXT,
  written_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Decision Log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decision_logs (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  child_id TEXT REFERENCES children(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL,
  proposed_by UUID NOT NULL REFERENCES profiles(id),
  approved_by TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'proposed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Meeting Minutes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  agenda TEXT,
  decisions JSONB,
  agreements JSONB,
  next_steps JSONB,
  written_by UUID NOT NULL,
  approved_by TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Stripe Subscriptions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'inactive',
  billing_interval TEXT DEFAULT 'monthly',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Key Dates ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS key_dates (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  child_id TEXT,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  recurrence TEXT DEFAULT 'once',
  reminder_days_before INT DEFAULT 7,
  notes TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'device_tokens', 'households', 'children',
    'custody_plans', 'calendar_events', 'tasks', 'meal_plans',
    'message_threads', 'expenses', 'decision_logs', 'meeting_minutes',
    'stripe_subscriptions'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', tbl, tbl);
  END LOOP;
END $$;

-- ─── Auto-create profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || encode(NEW.id::bytea, 'hex'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── RLS Policies ───────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_dates ENABLE ROW LEVEL SECURITY;

-- Helper: Get user's household IDs
CREATE OR REPLACE FUNCTION user_household_ids()
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(household_id)
  FROM household_members
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: users can read all profiles in their households, update own
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can read household members" ON profiles FOR SELECT USING (
  id IN (
    SELECT hm.user_id FROM household_members hm
    WHERE hm.household_id = ANY(user_household_ids())
  )
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Device tokens
CREATE POLICY "Users manage own tokens" ON device_tokens FOR ALL USING (user_id = auth.uid());

-- Households: members can read/update
CREATE POLICY "Members can read households" ON households FOR SELECT USING (id = ANY(user_household_ids()));
CREATE POLICY "Members can update households" ON households FOR UPDATE USING (id = ANY(user_household_ids()));
CREATE POLICY "Anyone can create household" ON households FOR INSERT WITH CHECK (true);

-- Household members
CREATE POLICY "Members can read members" ON household_members FOR SELECT USING (household_id = ANY(user_household_ids()));
CREATE POLICY "Members can add members" ON household_members FOR INSERT WITH CHECK (household_id = ANY(user_household_ids()) OR user_id = auth.uid());
CREATE POLICY "Members can delete own membership" ON household_members FOR DELETE USING (user_id = auth.uid());

-- Children: household members can CRUD
CREATE POLICY "Household members can read children" ON children FOR SELECT USING (household_id = ANY(user_household_ids()));
CREATE POLICY "Household members can create children" ON children FOR INSERT WITH CHECK (household_id = ANY(user_household_ids()));
CREATE POLICY "Household members can update children" ON children FOR UPDATE USING (household_id = ANY(user_household_ids()));
CREATE POLICY "Household members can delete children" ON children FOR DELETE USING (household_id = ANY(user_household_ids()));

-- Institutions
CREATE POLICY "Household members can manage institutions" ON institutions FOR ALL USING (household_id = ANY(user_household_ids()));

-- Custody plans
CREATE POLICY "Household members can manage custody plans" ON custody_plans FOR ALL USING (household_id = ANY(user_household_ids()));

-- Calendar events: created_by or assigned_to
CREATE POLICY "Users can read relevant events" ON calendar_events FOR SELECT USING (
  created_by = auth.uid() OR auth.uid()::text = ANY(assigned_to)
);
CREATE POLICY "Users can create events" ON calendar_events FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own events" ON calendar_events FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own events" ON calendar_events FOR DELETE USING (created_by = auth.uid());

-- Tasks: assigned_to or created_by
CREATE POLICY "Users can read own tasks" ON tasks FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Users can create tasks" ON tasks FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (created_by = auth.uid());

-- Shopping items: all authenticated users can manage
CREATE POLICY "Authenticated users can manage shopping" ON shopping_items FOR ALL USING (auth.uid() IS NOT NULL);

-- Meal plans
CREATE POLICY "Authenticated users can manage meals" ON meal_plans FOR ALL USING (auth.uid() IS NOT NULL);

-- Message threads: participants only
CREATE POLICY "Participants can read threads" ON message_threads FOR SELECT USING (auth.uid()::text = ANY(participants));
CREATE POLICY "Users can create threads" ON message_threads FOR INSERT WITH CHECK (auth.uid()::text = ANY(participants));
CREATE POLICY "Participants can update threads" ON message_threads FOR UPDATE USING (auth.uid()::text = ANY(participants));
CREATE POLICY "Participants can delete threads" ON message_threads FOR DELETE USING (auth.uid()::text = ANY(participants));

-- Messages: thread participants
CREATE POLICY "Thread participants can read messages" ON messages FOR SELECT USING (
  thread_id IN (SELECT id FROM message_threads WHERE auth.uid()::text = ANY(participants))
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (sender_id = auth.uid());

-- Expenses: paid_by or split_with
CREATE POLICY "Users can read own expenses" ON expenses FOR SELECT USING (
  paid_by = auth.uid() OR auth.uid()::text = ANY(split_with)
);
CREATE POLICY "Users can create expenses" ON expenses FOR INSERT WITH CHECK (paid_by = auth.uid());
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (paid_by = auth.uid() OR auth.uid()::text = ANY(split_with));
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (paid_by = auth.uid());

-- Documents: uploaded_by or shared_with
CREATE POLICY "Users can read own documents" ON documents FOR SELECT USING (
  uploaded_by = auth.uid() OR auth.uid()::text = ANY(shared_with)
);
CREATE POLICY "Users can create documents" ON documents FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (uploaded_by = auth.uid());

-- Milestones: added_by
CREATE POLICY "Users can manage own milestones" ON milestones FOR ALL USING (added_by = auth.uid());

-- Family photos
CREATE POLICY "Users can manage own photos" ON family_photos FOR ALL USING (added_by = auth.uid());

-- Diary entries
CREATE POLICY "Users can manage own diary" ON diary_entries FOR ALL USING (written_by = auth.uid());

-- Decision logs
CREATE POLICY "Users can read own decisions" ON decision_logs FOR SELECT USING (proposed_by = auth.uid() OR auth.uid()::text = ANY(approved_by));
CREATE POLICY "Users can create decisions" ON decision_logs FOR INSERT WITH CHECK (proposed_by = auth.uid());
CREATE POLICY "Users can update own decisions" ON decision_logs FOR UPDATE USING (proposed_by = auth.uid() OR auth.uid()::text = ANY(approved_by));
CREATE POLICY "Users can delete own decisions" ON decision_logs FOR DELETE USING (proposed_by = auth.uid());

-- Meeting minutes
CREATE POLICY "Authenticated users can manage meetings" ON meeting_minutes FOR ALL USING (auth.uid() IS NOT NULL);

-- Stripe subscriptions
CREATE POLICY "Users can read own subscription" ON stripe_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own subscription" ON stripe_subscriptions FOR ALL USING (user_id = auth.uid());

-- Key dates
CREATE POLICY "Users can manage own key dates" ON key_dates FOR ALL USING (added_by = auth.uid());
