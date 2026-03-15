-- ============================================================
-- Notification Preferences + RLS
-- Kør dette i Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  handover_reminders BOOLEAN DEFAULT TRUE,
  handover_reminder_minutes INTEGER DEFAULT 30,
  schedule_changes BOOLEAN DEFAULT TRUE,
  event_reminders BOOLEAN DEFAULT TRUE,
  important_dates BOOLEAN DEFAULT TRUE,
  task_assigned BOOLEAN DEFAULT TRUE,
  task_deadline BOOLEAN DEFAULT TRUE,
  expense_pending BOOLEAN DEFAULT TRUE,
  expense_updates BOOLEAN DEFAULT TRUE,
  new_messages BOOLEAN DEFAULT TRUE,
  professional_messages BOOLEAN DEFAULT TRUE,
  meal_plan_reminder BOOLEAN DEFAULT TRUE,
  shopping_reminder BOOLEAN DEFAULT TRUE,
  cleaning_reminder BOOLEAN DEFAULT TRUE,
  document_shared BOOLEAN DEFAULT TRUE,
  decision_proposed BOOLEAN DEFAULT TRUE,
  diary_reminder BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select" ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_insert" ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_preferences_update" ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());
