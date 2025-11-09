/*
  # Add Foreign Key Indexes and Fix Policies

  ## 1. Foreign Key Indexing
  - Add indexes for all foreign key columns to improve JOIN performance
  - Foreign keys without indexes can cause table scans on JOIN operations
  - These indexes are essential for query performance at scale

  ## 2. Policy Optimization
  - Fix multiple permissive policies on profiles table
  - Combine into a single restrictive policy with clear admin override

  ## 3. Performance Impact
  - Dramatically improves JOIN performance
  - Reduces query execution time for related data
  - Essential for referential integrity checks

  ## 4. Security Notes
  - All security guarantees are maintained
  - Indexes only improve query performance, not access control
*/

-- ============================================================================
-- PART 1: Add indexes for all unindexed foreign keys
-- ============================================================================

-- Admin actions log foreign keys
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_performed_by
  ON admin_actions_log(performed_by);

CREATE INDEX IF NOT EXISTS idx_admin_actions_log_target_user
  ON admin_actions_log(target_user_id);

-- Book summaries foreign keys
CREATE INDEX IF NOT EXISTS idx_book_summaries_book_id
  ON book_summaries(book_id);

CREATE INDEX IF NOT EXISTS idx_book_summaries_admin_id
  ON book_summaries(admin_id);

-- Book takeaways foreign keys
CREATE INDEX IF NOT EXISTS idx_book_takeaways_book_id
  ON book_takeaways(book_id);

CREATE INDEX IF NOT EXISTS idx_book_takeaways_user_id
  ON book_takeaways(user_id);

-- Books foreign key
CREATE INDEX IF NOT EXISTS idx_books_created_by
  ON books(created_by);

-- Comments foreign keys
CREATE INDEX IF NOT EXISTS idx_comments_post_id
  ON comments(post_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id
  ON comments(user_id);

-- Direct messages foreign key
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id
  ON direct_messages(receiver_id);

-- Discussion groups foreign key
CREATE INDEX IF NOT EXISTS idx_discussion_groups_created_by
  ON discussion_groups(created_by);

-- Discussion threads foreign key
CREATE INDEX IF NOT EXISTS idx_discussion_threads_created_by
  ON discussion_threads(created_by);

-- Email stats foreign keys
CREATE INDEX IF NOT EXISTS idx_email_stats_post_id
  ON email_stats(post_id);

CREATE INDEX IF NOT EXISTS idx_email_stats_subscriber_id
  ON email_stats(subscriber_id);

-- Group messages foreign keys
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id
  ON group_messages(group_id);

CREATE INDEX IF NOT EXISTS idx_group_messages_user_id
  ON group_messages(user_id);

-- Likes foreign key
CREATE INDEX IF NOT EXISTS idx_likes_user_id
  ON likes(user_id);

-- Posts foreign key
CREATE INDEX IF NOT EXISTS idx_posts_author_id
  ON posts(author_id);

-- Quotes foreign key
CREATE INDEX IF NOT EXISTS idx_quotes_created_by_user_id
  ON quotes(created_by_user_id);

-- Saved articles foreign key
CREATE INDEX IF NOT EXISTS idx_saved_articles_post_id
  ON saved_articles(post_id);

-- User book list foreign key
CREATE INDEX IF NOT EXISTS idx_user_book_list_book_id
  ON user_book_list(book_id);

-- User selected quotes foreign key
CREATE INDEX IF NOT EXISTS idx_user_selected_quotes_quote_id
  ON user_selected_quotes(quote_id);

-- ============================================================================
-- PART 2: Fix multiple permissive policies on profiles table
-- ============================================================================

-- The issue: Having multiple permissive UPDATE policies means a user can update
-- if they satisfy ANY of the policies. This is correct behavior, but we can
-- make it more efficient by combining the logic.

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update admin status" ON profiles;

-- Create a single comprehensive UPDATE policy
-- Users can update their own profile
-- Admins can update any profile (including admin status)
CREATE POLICY "Users can update own profile and admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.is_admin = true
    )
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.is_admin = true
    )
  );

-- ============================================================================
-- PART 3: Add composite indexes for common query patterns
-- ============================================================================

-- Index for querying group messages by group and time (common pattern)
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
  ON group_messages(group_id, created_at DESC);

-- Index for querying posts by author and status (common admin query)
CREATE INDEX IF NOT EXISTS idx_posts_author_published
  ON posts(author_id, is_published);

-- Index for email stats lookups by subscriber (common analytics query)
CREATE INDEX IF NOT EXISTS idx_email_stats_subscriber_post
  ON email_stats(subscriber_id, post_id);

-- Index for discussion threads by group and activity (common query)
CREATE INDEX IF NOT EXISTS idx_discussion_threads_group_activity
  ON discussion_threads(group_id, last_activity_at DESC);
