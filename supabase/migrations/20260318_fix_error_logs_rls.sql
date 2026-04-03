-- Ensure error_logs table has correct RLS policies
-- The INSERT policy may be missing, causing 42501 errors

ALTER TABLE IF EXISTS error_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to ensure clean state
DROP POLICY IF EXISTS "Users can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Admins can read error logs" ON error_logs;

-- All authenticated users can insert error logs
CREATE POLICY "Users can insert error logs"
  ON error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can read error logs
CREATE POLICY "Admins can read error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );
