/*
  # Fix Function Search Paths for Security

  1. Security Enhancement
    - Set stable search_path on all functions to prevent search path attacks
    - This ensures functions always reference the correct schema objects
    - Prevents malicious users from hijacking function behavior
    
  2. Functions Updated
    - handle_new_user: User profile creation trigger function
    - auto_publish_scheduled_posts: Scheduled post publishing function
    - set_admin_title: Admin title assignment trigger function
    - increment_view_count: Post view counter function
    - update_thread_activity: Thread activity tracker function
    
  3. Important Notes
    - All functions are recreated with SET search_path = public, pg_temp
    - This is the recommended secure search_path setting
    - Function logic remains unchanged, only security is improved
*/

-- ============================================================================
-- UPDATE handle_new_user FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, bio)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- UPDATE auto_publish_scheduled_posts FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_publish_scheduled_posts()
RETURNS TABLE(published_count integer, published_post_ids bigint[]) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_ids bigint[];
  update_count integer;
BEGIN
  WITH updated AS (
    UPDATE posts
    SET 
      is_published = true,
      scheduling_status = 'published',
      updated_at = now()
    WHERE 
      scheduling_status = 'scheduled'
      AND scheduled_publish_at IS NOT NULL
      AND scheduled_publish_at <= now()
    RETURNING id
  )
  SELECT array_agg(id), count(*)::integer
  INTO updated_ids, update_count
  FROM updated;

  RETURN QUERY SELECT 
    COALESCE(update_count, 0),
    COALESCE(updated_ids, ARRAY[]::bigint[]);
END;
$$;

-- ============================================================================
-- UPDATE set_admin_title FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION set_admin_title()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_admin = true THEN
    NEW.user_title := 'insight_leader';
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- UPDATE increment_view_count FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_view_count(post_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$;

-- ============================================================================
-- UPDATE update_thread_activity FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_thread_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
    UPDATE discussion_threads
    SET 
      last_activity_at = NEW.created_at,
      message_count = message_count + 1
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$;
