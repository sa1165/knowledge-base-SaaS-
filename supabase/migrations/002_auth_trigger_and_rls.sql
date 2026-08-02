-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Full RLS Policies + Auth Trigger for User Profile Auto-Creation
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. ADD MISSING RLS POLICIES FOR users TABLE ──────────────────────────

-- Allow authenticated users to read any user's profile (needed for member joins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Authenticated users can read all profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read all profiles"
      ON public.users FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow users to update only their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.users FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- Allow inserts (needed for trigger + backfill)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Service role can insert users'
  ) THEN
    CREATE POLICY "Service role can insert users"
      ON public.users FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ── 2. AUTH TRIGGER: Auto-create a user profile row on signup ────────────
-- Fires every time someone signs up via email or Google OAuth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    name      = COALESCE(EXCLUDED.name, public.users.name),
    image_url = COALESCE(EXCLUDED.image_url, public.users.image_url);
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 3. BACKFILL: Create profiles for users who already signed up ──────────
INSERT INTO public.users (id, email, name, image_url, created_at)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ),
  raw_user_meta_data->>'avatar_url',
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email     = EXCLUDED.email,
  name      = COALESCE(EXCLUDED.name, public.users.name),
  image_url = COALESCE(EXCLUDED.image_url, public.users.image_url);

-- ── 4. AUTO-UPDATE updated_at ON CHANGES ────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workspaces_updated_at ON public.workspaces;
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
