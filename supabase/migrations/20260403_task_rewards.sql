-- Task reward system
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS reward_value INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES profiles(id);

-- Household reward configuration
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS rewards_type TEXT DEFAULT 'point',
  ADD COLUMN IF NOT EXISTS rewards_value INT DEFAULT 10;
