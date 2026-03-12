-- ============================================================================
-- SKALERBARHED: RPC-funktioner for atomiske operationer (undgår N+1 queries)
-- Kør dette i Supabase SQL Editor EFTER migration-indexes.sql
-- ============================================================================

-- ── approve_expense ─────────────────────────────────────────────────────────
-- Atomisk godkendelse af udgift: Tilføjer bruger til approved_by og
-- sætter status til 'approved' hvis alle split_with-brugere har godkendt.
-- Erstatter 2 separate queries (SELECT + UPDATE) med 1 atomisk operation.
CREATE OR REPLACE FUNCTION approve_expense(expense_id TEXT, approver_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_approved TEXT[];
  current_split TEXT[];
  new_approved TEXT[];
  all_approved BOOLEAN;
BEGIN
  -- Hent nuværende tilstand
  SELECT approved_by, split_with
  INTO current_approved, current_split
  FROM expenses
  WHERE id = expense_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found: %', expense_id;
  END IF;

  -- Tilføj approver hvis ikke allerede til stede
  IF NOT (approver_id = ANY(COALESCE(current_approved, ARRAY[]::TEXT[]))) THEN
    new_approved := array_append(COALESCE(current_approved, ARRAY[]::TEXT[]), approver_id);
  ELSE
    new_approved := current_approved;
  END IF;

  -- Tjek om alle split_with-brugere har godkendt
  all_approved := true;
  FOR i IN 1..COALESCE(array_length(current_split, 1), 0) LOOP
    IF NOT (current_split[i] = ANY(new_approved)) THEN
      all_approved := false;
      EXIT;
    END IF;
  END LOOP;

  -- Opdatér i én operation
  UPDATE expenses
  SET
    approved_by = new_approved,
    status = CASE WHEN all_approved THEN 'approved' ELSE status END,
    updated_at = now()
  WHERE id = expense_id;
END;
$$;


-- ── soft_delete_thread ──────────────────────────────────────────────────────
-- Atomisk soft-delete af beskedtråd: Tilføjer bruger til deleted_by array.
-- Erstatter SELECT + UPDATE med 1 atomisk operation.
CREATE OR REPLACE FUNCTION soft_delete_thread(thread_id TEXT, deleter_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE message_threads
  SET deleted_by = array_append(COALESCE(deleted_by, ARRAY[]::TEXT[]), deleter_id),
      updated_at = now()
  WHERE id = thread_id
    AND NOT (deleter_id = ANY(COALESCE(deleted_by, ARRAY[]::TEXT[])));

  IF NOT FOUND THEN
    -- Enten fandtes tråden ikke, eller brugeren har allerede slettet den
    NULL;
  END IF;
END;
$$;


-- ── Grants ──────────────────────────────────────────────────────────────────
-- Tillad authenticated brugere at kalde disse funktioner
GRANT EXECUTE ON FUNCTION approve_expense(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_thread(TEXT, TEXT) TO authenticated;
