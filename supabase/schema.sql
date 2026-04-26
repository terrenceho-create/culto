-- ============================================================
-- Culto — Database Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- Extends Supabase auth.users (same UUID as primary key)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         TEXT UNIQUE NOT NULL,
  display_name     TEXT,
  avatar_url       TEXT,
  bio              TEXT CHECK (char_length(bio) <= 160),
  tags             TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 5),
  invited_by       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  show_invited_by  BOOLEAN NOT NULL DEFAULT true,
  is_admin         BOOLEAN NOT NULL DEFAULT false,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  invite_quota     INTEGER NOT NULL DEFAULT 0,
  age_confirmed    BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVITES
-- Each row is one invite code
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  used_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- POSTS
-- Supports text, images (array of URLs), and link previews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content       TEXT,
  image_urls    TEXT[] NOT NULL DEFAULT '{}',
  link_url      TEXT,
  link_preview  JSONB,          -- { title, description, image, favicon }
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT posts_has_content CHECK (
    content IS NOT NULL OR array_length(image_urls, 1) > 0 OR link_url IS NOT NULL
  )
);

-- ============================================================
-- SHARES
-- Tracks who shared what and from whom (for propagation chain)
-- shared_from NULL = direct share from original post
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shares (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  shared_by    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_from  UUID REFERENCES public.shares(id) ON DELETE SET NULL,
  comment      TEXT,            -- optional commentary when sharing
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, shared_by)   -- one share per user per post
);

-- ============================================================
-- FOLLOWS
-- follower_id follows following_id
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- ============================================================
-- LIKES (private — only visible to post author)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_deleted  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_posts_author_id    ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at   ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_post_id     ON public.shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by   ON public.shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_follows_follower   ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following  ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id      ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id      ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_invites_code       ON public.invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON public.invites(created_by);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's id
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT auth.uid()
$$;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  )
$$;

-- ---- USERS policies ----
CREATE POLICY "Users are publicly readable"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin can update any user"
  ON public.users FOR UPDATE USING (public.is_admin());

-- Insert handled by trigger after auth.users row created (see below)
CREATE POLICY "Users insert own row"
  ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- ---- INVITES policies ----
CREATE POLICY "Owner can see own invites"
  ON public.invites FOR SELECT USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Owner can create invites"
  ON public.invites FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admin full access invites"
  ON public.invites FOR ALL USING (public.is_admin());

-- Allow reading invite code during registration (unauthenticated check)
CREATE POLICY "Public can read invite code for validation"
  ON public.invites FOR SELECT USING (used_by IS NULL);

-- Note: invite creation, marking-used, and quota adjustments are handled
-- server-side via the service-role admin client, bypassing RLS entirely.

-- ---- POSTS policies ----
CREATE POLICY "Active users can read non-deleted posts"
  ON public.posts FOR SELECT
  USING (
    is_deleted = false
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

CREATE POLICY "Authenticated active users can insert posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

CREATE POLICY "Authors can soft-delete own posts"
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Admin can manage all posts"
  ON public.posts FOR ALL USING (public.is_admin());

-- ---- SHARES policies ----
CREATE POLICY "Active users can read shares"
  ON public.shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

CREATE POLICY "Active users can share"
  ON public.shares FOR INSERT
  WITH CHECK (
    shared_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

-- ---- FOLLOWS policies ----
CREATE POLICY "Active users can see follows"
  ON public.follows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

CREATE POLICY "Users manage own follows"
  ON public.follows FOR ALL
  USING (follower_id = auth.uid());

-- ---- LIKES policies ----
-- Only the post author and the liker can see likes (private likes)
CREATE POLICY "Liker can see own likes"
  ON public.likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Post author can see likes on own posts"
  ON public.likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
    )
  );

CREATE POLICY "Active users can like"
  ON public.likes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

CREATE POLICY "Users can unlike own likes"
  ON public.likes FOR DELETE USING (user_id = auth.uid());

-- ---- COMMENTS policies ----
CREATE POLICY "Active users can read non-deleted comments"
  ON public.comments FOR SELECT
  USING (
    is_deleted = false
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

CREATE POLICY "Active users can comment"
  ON public.comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
    )
  );

CREATE POLICY "Authors can soft-delete own comments"
  ON public.comments FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admin can manage all comments"
  ON public.comments FOR ALL USING (public.is_admin());

-- ============================================================
-- MONTHLY INVITE QUOTA RESET (run via pg_cron or Supabase Edge Function)
-- This function resets every active user's invite_quota to 1.
-- Schedule it monthly via Supabase Dashboard > Database > Functions.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_monthly_invite_quota()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users
  SET invite_quota = 1
  WHERE is_active = true;
END;
$$;

-- ============================================================
-- STORAGE BUCKET (run once in Supabase Storage UI or here)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT DO NOTHING;
