-- Add professional thread support to message_threads
ALTER TABLE message_threads
  ADD COLUMN IF NOT EXISTS is_professional_thread BOOLEAN DEFAULT false;

-- Allow professionals to create and participate in threads
-- (existing RLS on message_threads allows insert if user is a participant)
-- No extra policies needed — professionals are added as participants on creation.

-- Notify family members when a professional sends a message (handled in app)
