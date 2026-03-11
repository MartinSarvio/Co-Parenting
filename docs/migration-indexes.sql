-- ============================================================================
-- SKALERBARHED: Tilføj manglende indexes til alle kernetabeller
-- Kør dette i Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================
-- Estimeret forbedring: 50-70% bedre query-latency ved 100K+ brugere
-- Sikker at køre: "IF NOT EXISTS" forhindrer duplikater
-- ============================================================================

-- ── calendar_events ─────────────────────────────────────────────────────────
-- Bruges til: Kalendervisning (filtrér på bruger + dato-range)
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by
  ON calendar_events(created_by);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date
  ON calendar_events(start_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_child_id
  ON calendar_events(child_id);

-- Composite: Hyppigste query — "mine events i en given periode"
CREATE INDEX IF NOT EXISTS idx_calendar_events_createdby_start
  ON calendar_events(created_by, start_date DESC);

-- ── tasks ───────────────────────────────────────────────────────────────────
-- Bruges til: Opgaveliste (filtrér på tildelt bruger, udfuldført status)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
  ON tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
  ON tasks(created_by);

-- Composite: "Mine åbne opgaver, sorteret efter deadline"
CREATE INDEX IF NOT EXISTS idx_tasks_assignedto_completed
  ON tasks(assigned_to, completed, deadline);

-- ── expenses ────────────────────────────────────────────────────────────────
-- Bruges til: Udgiftsoversigt (filtrér på betaler + dato)
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by
  ON expenses(paid_by);

CREATE INDEX IF NOT EXISTS idx_expenses_date
  ON expenses(date DESC);

-- Composite: "Mine udgifter, nyeste først"
CREATE INDEX IF NOT EXISTS idx_expenses_paidby_date
  ON expenses(paid_by, date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_status
  ON expenses(status);

-- ── messages ────────────────────────────────────────────────────────────────
-- Bruges til: Beskedvisning (alle beskeder i en tråd, sorteret)
CREATE INDEX IF NOT EXISTS idx_messages_thread_id
  ON messages(thread_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON messages(sender_id);

-- Composite: "Beskeder i tråd, nyeste først"
CREATE INDEX IF NOT EXISTS idx_messages_threadid_createdat
  ON messages(thread_id, created_at DESC);

-- ── message_threads ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_message_threads_updated
  ON message_threads(updated_at DESC);

-- ── documents ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by
  ON documents(uploaded_by);

-- ── children ────────────────────────────────────────────────────────────────
-- Bruges til: Alle børnerelaterede opslag
CREATE INDEX IF NOT EXISTS idx_children_household_id
  ON children(household_id);

CREATE INDEX IF NOT EXISTS idx_children_parent1_id
  ON children(parent1_id);

CREATE INDEX IF NOT EXISTS idx_children_parent2_id
  ON children(parent2_id);

-- ── household_members ───────────────────────────────────────────────────────
-- Bruges til: "Hvilke husstande er brugeren med i?"
CREATE INDEX IF NOT EXISTS idx_household_members_household_id
  ON household_members(household_id);

CREATE INDEX IF NOT EXISTS idx_household_members_user_id
  ON household_members(user_id);

-- ── diary_entries ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_diary_entries_child_id
  ON diary_entries(child_id);

CREATE INDEX IF NOT EXISTS idx_diary_entries_written_by
  ON diary_entries(written_by);

CREATE INDEX IF NOT EXISTS idx_diary_entries_date
  ON diary_entries(date DESC);

-- ── milestones ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_milestones_child_id
  ON milestones(child_id);

-- ── family_photos ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_family_photos_child_id
  ON family_photos(child_id);

CREATE INDEX IF NOT EXISTS idx_family_photos_added_by
  ON family_photos(added_by);

-- ── decision_logs ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_decision_logs_child_id
  ON decision_logs(child_id);

CREATE INDEX IF NOT EXISTS idx_decision_logs_proposed_by
  ON decision_logs(proposed_by);

-- ── custody_plans ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_custody_plans_child_id
  ON custody_plans(child_id);

CREATE INDEX IF NOT EXISTS idx_custody_plans_household_id
  ON custody_plans(household_id);

-- ── key_dates ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_key_dates_child_id
  ON key_dates(child_id);

CREATE INDEX IF NOT EXISTS idx_key_dates_added_by
  ON key_dates(added_by);

CREATE INDEX IF NOT EXISTS idx_key_dates_date
  ON key_dates(date);

-- ── meal_plans ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meal_plans_created_by
  ON meal_plans(created_by);

CREATE INDEX IF NOT EXISTS idx_meal_plans_date
  ON meal_plans(date);

-- ── shopping_items ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shopping_items_added_by
  ON shopping_items(added_by);

CREATE INDEX IF NOT EXISTS idx_shopping_items_purchased
  ON shopping_items(purchased);

-- ── meeting_minutes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_written_by
  ON meeting_minutes(written_by);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date
  ON meeting_minutes(date DESC);

-- ── stripe_subscriptions ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status
  ON stripe_subscriptions(status);

-- ── profiles ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);

-- ============================================================================
-- VERIFIKATION: Kør dette efter for at se alle indexes
-- ============================================================================
-- SELECT tablename, indexname FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
