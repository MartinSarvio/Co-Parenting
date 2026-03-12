-- ============================================================
-- Professional Cases — 5 tabeller + RLS
-- ============================================================

-- ─── Professional Departments ─────────────────────────────
CREATE TABLE IF NOT EXISTS professional_departments (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  municipality TEXT NOT NULL,
  department_code TEXT NOT NULL,
  department_name TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prof_dept_municipality ON professional_departments(municipality);

-- ─── Professional Cases ───────────────────────────────────
CREATE TABLE IF NOT EXISTS professional_cases (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  case_number TEXT NOT NULL,
  department_id TEXT NOT NULL,
  municipality TEXT DEFAULT '',
  family_name TEXT NOT NULL,
  parents TEXT[] DEFAULT '{}',
  child_name TEXT NOT NULL,
  child_age INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'paused')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  last_contact TIMESTAMPTZ,
  next_meeting TIMESTAMPTZ,
  unread_messages INT DEFAULT 0,
  pending_approvals INT DEFAULT 0,
  notes TEXT DEFAULT '',
  assigned_to UUID NOT NULL REFERENCES profiles(id),
  household_id TEXT REFERENCES households(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prof_cases_assigned ON professional_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prof_cases_status ON professional_cases(status);

-- ─── Case Notes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_notes (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  case_id TEXT NOT NULL REFERENCES professional_cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_case_notes_case ON case_notes(case_id);

-- ─── Case Activity Log ───────────────────────────────────
CREATE TABLE IF NOT EXISTS case_activity_log (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  case_id TEXT NOT NULL REFERENCES professional_cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  description TEXT,
  related_id TEXT,
  related_type TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_case_activity_case ON case_activity_log(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activity_created ON case_activity_log(created_at DESC);

-- ─── Risk Assessments ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  case_id TEXT NOT NULL REFERENCES professional_cases(id) ON DELETE CASCADE,
  assessor_id UUID NOT NULL REFERENCES profiles(id),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_factors JSONB DEFAULT '[]',
  protective_factors TEXT,
  summary TEXT,
  recommendations TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved')),
  sent_to TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_case ON risk_assessments(case_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE professional_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Departments: all authenticated users can read
CREATE POLICY "Read departments" ON professional_departments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Cases: professionals can only see cases assigned to them
CREATE POLICY "Read own cases" ON professional_cases
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Create cases" ON professional_cases
  FOR INSERT WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Update own cases" ON professional_cases
  FOR UPDATE USING (assigned_to = auth.uid());

-- Case Notes: scoped to case's professional
CREATE POLICY "Read case notes" ON case_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_cases
      WHERE id = case_notes.case_id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "Create case notes" ON case_notes
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Delete own notes" ON case_notes
  FOR DELETE USING (author_id = auth.uid());

-- Activity Log: scoped to case's professional
CREATE POLICY "Read case activities" ON case_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_cases
      WHERE id = case_activity_log.case_id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "Create case activity" ON case_activity_log
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Risk Assessments: scoped to case's professional
CREATE POLICY "Read risk assessments" ON risk_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_cases
      WHERE id = risk_assessments.case_id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "Create risk assessment" ON risk_assessments
  FOR INSERT WITH CHECK (assessor_id = auth.uid());

CREATE POLICY "Update own risk assessment" ON risk_assessments
  FOR UPDATE USING (assessor_id = auth.uid());
