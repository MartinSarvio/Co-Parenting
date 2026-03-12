-- ============================================================
-- Forum / Grupper — 6 tabeller + RLS + triggers
-- ============================================================

-- ─── Forum Groups ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_groups (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'open' CHECK (type IN ('open', 'closed')),
  rules TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_groups_owner ON forum_groups(owner_id);

-- ─── Forum Group Members ──────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_group_members (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  group_id TEXT NOT NULL REFERENCES forum_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_group_members_group ON forum_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_forum_group_members_user ON forum_group_members(user_id);

-- ─── Forum Join Requests ──────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_join_requests (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  group_id TEXT NOT NULL REFERENCES forum_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_join_requests_group ON forum_join_requests(group_id);

-- ─── Forum Posts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  group_id TEXT REFERENCES forum_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image TEXT DEFAULT '',
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_posts_group ON forum_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);

-- ─── Forum Comments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_comments (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id);

-- ─── Forum Post Likes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post ON forum_post_likes(post_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE forum_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of a group
CREATE OR REPLACE FUNCTION is_forum_member(gid TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM forum_group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if group is open
CREATE OR REPLACE FUNCTION is_forum_group_open(gid TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM forum_groups WHERE id = gid AND type = 'open'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is owner of a group
CREATE OR REPLACE FUNCTION is_forum_owner(gid TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM forum_groups WHERE id = gid AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Groups policies ───────────────────────────────────────
-- All authenticated users can read groups
CREATE POLICY "Anyone can read groups" ON forum_groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only authenticated users can create groups
CREATE POLICY "Authenticated users can create groups" ON forum_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- Only owner can update group
CREATE POLICY "Owner can update group" ON forum_groups
  FOR UPDATE USING (owner_id = auth.uid());

-- Only owner can delete group
CREATE POLICY "Owner can delete group" ON forum_groups
  FOR DELETE USING (owner_id = auth.uid());

-- ── Group Members policies ────────────────────────────────
-- Members can read members of groups they belong to, or open groups
CREATE POLICY "Read group members" ON forum_group_members
  FOR SELECT USING (
    is_forum_member(group_id) OR is_forum_group_open(group_id)
  );

-- Users can join open groups or owner can add members
CREATE POLICY "Join group" ON forum_group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (is_forum_group_open(group_id) OR is_forum_owner(group_id))
  );

-- Users can leave, owner can remove members
CREATE POLICY "Leave group" ON forum_group_members
  FOR DELETE USING (
    user_id = auth.uid() OR is_forum_owner(group_id)
  );

-- ── Join Requests policies ────────────────────────────────
-- Users can see their own requests, owners can see requests for their groups
CREATE POLICY "Read join requests" ON forum_join_requests
  FOR SELECT USING (
    user_id = auth.uid() OR is_forum_owner(group_id)
  );

-- Users can create join requests for closed groups
CREATE POLICY "Create join request" ON forum_join_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete own request, owners can update status
CREATE POLICY "Manage join request" ON forum_join_requests
  FOR UPDATE USING (is_forum_owner(group_id));

CREATE POLICY "Delete own join request" ON forum_join_requests
  FOR DELETE USING (user_id = auth.uid());

-- ── Posts policies ────────────────────────────────────────
-- Read posts in open groups or groups user is member of; general feed (group_id IS NULL) visible to all
CREATE POLICY "Read forum posts" ON forum_posts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      group_id IS NULL OR
      is_forum_group_open(group_id) OR
      is_forum_member(group_id)
    )
  );

-- Create posts in groups user is member of, or general feed
CREATE POLICY "Create forum post" ON forum_posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      group_id IS NULL OR
      is_forum_member(group_id)
    )
  );

-- Users can update/delete own posts
CREATE POLICY "Update own post" ON forum_posts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Delete own post" ON forum_posts
  FOR DELETE USING (user_id = auth.uid() OR is_forum_owner(group_id));

-- ── Comments policies ─────────────────────────────────────
-- Read comments on posts user can read (handled by post visibility)
CREATE POLICY "Read forum comments" ON forum_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Create forum comment" ON forum_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own comment" ON forum_comments
  FOR DELETE USING (user_id = auth.uid());

-- ── Likes policies ────────────────────────────────────────
CREATE POLICY "Read likes" ON forum_post_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Toggle like" ON forum_post_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Remove like" ON forum_post_likes
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- Triggers: auto-update counters
-- ============================================================

-- member_count on forum_groups
CREATE OR REPLACE FUNCTION update_forum_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_forum_member_count
  AFTER INSERT OR DELETE ON forum_group_members
  FOR EACH ROW EXECUTE FUNCTION update_forum_member_count();

-- like_count on forum_posts
CREATE OR REPLACE FUNCTION update_forum_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_forum_like_count
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_forum_like_count();

-- comment_count on forum_posts
CREATE OR REPLACE FUNCTION update_forum_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_forum_comment_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION update_forum_comment_count();
