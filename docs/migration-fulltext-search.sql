-- ============================================================================
-- SKALERBARHED: Full-Text Search (FTS) indexes for server-side søgning
-- Kør dette i Supabase SQL Editor
-- ============================================================================
-- Sikker at køre flere gange (IF NOT EXISTS / OR REPLACE)
-- ============================================================================

-- ── Genereret tsvector-kolonne for calendar_events ──────────────────────────
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('danish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_calendar_events_fts ON calendar_events USING gin(fts);

-- ── Genereret tsvector-kolonne for tasks ────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('danish', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_tasks_fts ON tasks USING gin(fts);

-- ── Genereret tsvector-kolonne for expenses ─────────────────────────────────
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('danish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_expenses_fts ON expenses USING gin(fts);

-- ── Genereret tsvector-kolonne for messages ─────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('danish', coalesce(content, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_messages_fts ON messages USING gin(fts);

-- ── Genereret tsvector-kolonne for documents ────────────────────────────────
ALTER TABLE documents ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('danish', coalesce(title, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING gin(fts);

-- ── Genereret tsvector-kolonne for decision_logs ────────────────────────────
ALTER TABLE decision_logs ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('danish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(notes, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_decision_logs_fts ON decision_logs USING gin(fts);


-- ============================================================================
-- RPC: Server-side global søgning
-- ============================================================================

CREATE OR REPLACE FUNCTION global_search(search_query TEXT, max_results INT DEFAULT 15)
RETURNS TABLE(
  result_id TEXT,
  result_type TEXT,
  title TEXT,
  subtitle TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tsq tsquery;
BEGIN
  -- Konverter søgeterm til tsquery (med prefix-matching)
  tsq := plainto_tsquery('danish', search_query);
  IF tsq = ''::tsquery THEN
    tsq := to_tsquery('danish', search_query || ':*');
  END IF;

  RETURN QUERY
  (
    SELECT e.id, 'event'::TEXT, e.title, to_char(e.start_date, 'DD. Mon YYYY'), ts_rank(e.fts, tsq)
    FROM calendar_events e WHERE e.fts @@ tsq
    ORDER BY ts_rank(e.fts, tsq) DESC LIMIT max_results
  )
  UNION ALL
  (
    SELECT t.id, 'task'::TEXT, t.title, t.category, ts_rank(t.fts, tsq)
    FROM tasks t WHERE t.fts @@ tsq
    ORDER BY ts_rank(t.fts, tsq) DESC LIMIT max_results
  )
  UNION ALL
  (
    SELECT ex.id, 'expense'::TEXT, ex.title, ex.amount::TEXT || ' ' || ex.currency, ts_rank(ex.fts, tsq)
    FROM expenses ex WHERE ex.fts @@ tsq
    ORDER BY ts_rank(ex.fts, tsq) DESC LIMIT max_results
  )
  UNION ALL
  (
    SELECT m.id, 'message'::TEXT, left(m.content, 60), to_char(m.created_at, 'DD. Mon YYYY'), ts_rank(m.fts, tsq)
    FROM messages m WHERE m.fts @@ tsq
    ORDER BY ts_rank(m.fts, tsq) DESC LIMIT max_results
  )
  UNION ALL
  (
    SELECT d.id, 'document'::TEXT, d.title, d.type, ts_rank(d.fts, tsq)
    FROM documents d WHERE d.fts @@ tsq
    ORDER BY ts_rank(d.fts, tsq) DESC LIMIT max_results
  )
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION global_search(TEXT, INT) TO authenticated;


-- ============================================================================
-- ERROR TRACKING: Simpel fejl-log tabel
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  component TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Alle authenticated brugere kan logge fejl
CREATE POLICY "Users can insert error logs"
  ON error_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Kun admins kan læse fejl-logs
DROP POLICY IF EXISTS "Admins can read error logs" ON error_logs;
CREATE POLICY "Admins can read error logs"
  ON error_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
