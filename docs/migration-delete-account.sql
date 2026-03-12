-- ============================================================================
-- GDPR: Konto-sletning via RPC (alternativ til Edge Function)
-- Kør dette i Supabase SQL Editor
-- ============================================================================
-- Denne funktion anonymiserer alle persondata og sletter brugerens Auth-konto.
-- Kaldbar fra frontend via supabase.rpc('delete_my_account')
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Ikke logget ind';
  END IF;

  -- ── Anonymiser profil ──────────────────────────────────────
  UPDATE profiles SET
    name = 'Slettet bruger',
    email = 'deleted-' || uid || '@removed.local',
    avatar = NULL,
    phone = NULL,
    color = 'neutral',
    password_hash = 'DELETED'
  WHERE id = uid;

  -- ── Anonymiser dagbogsindlæg ───────────────────────────────
  UPDATE diary_entries SET
    content = '[Slettet]',
    mood = NULL
  WHERE user_id = uid;

  -- ── Anonymiser beskeder ────────────────────────────────────
  UPDATE messages SET
    content = '[Slettet]'
  WHERE sender_id = uid;

  -- ── Slet Storage-filer (markér som slettet) ────────────────
  DELETE FROM storage.objects
  WHERE owner = uid;

  -- ── Slet error logs ────────────────────────────────────────
  DELETE FROM error_logs WHERE user_id = uid;

  -- ── Slet Auth-bruger via admin API ─────────────────────────
  -- NB: Kræver service_role key — SECURITY DEFINER giver adgang
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Kun authenticated brugere kan kalde funktionen
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;
