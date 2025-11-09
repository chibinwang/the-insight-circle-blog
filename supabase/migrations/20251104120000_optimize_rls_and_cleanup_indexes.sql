/*
  # Optimize RLS Policies and Clean Up Indexes

  ## 1. RLS Performance Optimization
  - Replace `auth.uid()` with `(select auth.uid())` in all policies to prevent row-by-row evaluation
  - This dramatically improves query performance at scale by evaluating auth functions once per query

  ## 2. Policy Consolidation
  - Combine multiple permissive policies into single policies where appropriate
  - Reduces policy evaluation overhead and improves clarity

  ## 3. Index Cleanup
  - Remove unused indexes that create maintenance overhead without providing benefit
  - Keep only indexes that are actively used by queries

  ## 4. Security Notes
  - All changes maintain the same security guarantees
  - No changes to what users can access, only how policies are evaluated
*/

-- ============================================================================
-- PART 1: Drop and recreate RLS policies with optimized auth.uid() usage
-- ============================================================================

-- Profiles table policies
DROP POLICY IF EXISTS "Admins can update admin status for other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own title" ON profiles;

CREATE POLICY "Users can manage their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can update admin status"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Books table policies
DROP POLICY IF EXISTS "Only admins can create books" ON books;
DROP POLICY IF EXISTS "Only admins can update books" ON books;
DROP POLICY IF EXISTS "Only admins can delete books" ON books;

CREATE POLICY "Only admins can create books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Book summaries policies
DROP POLICY IF EXISTS "Only admins can create book summaries" ON book_summaries;
DROP POLICY IF EXISTS "Only admins can update book summaries" ON book_summaries;
DROP POLICY IF EXISTS "Only admins can delete book summaries" ON book_summaries;

CREATE POLICY "Only admins can create book summaries"
  ON book_summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update book summaries"
  ON book_summaries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete book summaries"
  ON book_summaries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Book takeaways policies
DROP POLICY IF EXISTS "Authenticated users can create book takeaways" ON book_takeaways;
DROP POLICY IF EXISTS "Users can update their own book takeaways" ON book_takeaways;
DROP POLICY IF EXISTS "Users can delete their own book takeaways" ON book_takeaways;

CREATE POLICY "Authenticated users can create book takeaways"
  ON book_takeaways FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own book takeaways"
  ON book_takeaways FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own book takeaways"
  ON book_takeaways FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- User book list policies
DROP POLICY IF EXISTS "Users can view their own book list" ON user_book_list;
DROP POLICY IF EXISTS "Users can add books to their own list" ON user_book_list;
DROP POLICY IF EXISTS "Users can remove books from their own list" ON user_book_list;

CREATE POLICY "Users can view their own book list"
  ON user_book_list FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can add books to their own list"
  ON user_book_list FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can remove books from their own list"
  ON user_book_list FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Admin actions log policies
DROP POLICY IF EXISTS "Admins can view admin actions log" ON admin_actions_log;
DROP POLICY IF EXISTS "Admins can insert into admin actions log" ON admin_actions_log;

CREATE POLICY "Admins can view admin actions log"
  ON admin_actions_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert into admin actions log"
  ON admin_actions_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- ============================================================================
-- PART 2: Consolidate multiple permissive policies
-- ============================================================================

-- Discussion groups - consolidate admin and user policies
DROP POLICY IF EXISTS "Admins can manage any group" ON discussion_groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON discussion_groups;
DROP POLICY IF EXISTS "Authenticated users can create discussion groups" ON discussion_groups;
DROP POLICY IF EXISTS "Discussion groups are viewable by everyone" ON discussion_groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON discussion_groups;

CREATE POLICY "Anyone can view discussion groups"
  ON discussion_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON discussion_groups FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Admins and creators can update groups"
  ON discussion_groups FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  )
  WITH CHECK (
    (select auth.uid()) = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Admins and creators can delete groups"
  ON discussion_groups FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

-- Discussion threads - consolidate admin and user policies
DROP POLICY IF EXISTS "Admins can manage all threads" ON discussion_threads;
DROP POLICY IF EXISTS "Thread creators can delete their threads" ON discussion_threads;
DROP POLICY IF EXISTS "Group members can create threads" ON discussion_threads;
DROP POLICY IF EXISTS "Group members can view threads" ON discussion_threads;
DROP POLICY IF EXISTS "Thread creators can update their threads" ON discussion_threads;

CREATE POLICY "Group members can view threads"
  ON discussion_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = discussion_threads.group_id
      AND user_id = (select auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Group members can create threads"
  ON discussion_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = discussion_threads.group_id
      AND user_id = (select auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Admins and creators can update threads"
  ON discussion_threads FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  )
  WITH CHECK (
    (select auth.uid()) = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Admins and creators can delete threads"
  ON discussion_threads FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

-- Group members - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all group members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can view members in groups" ON group_members;

CREATE POLICY "Users can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Users can leave groups and admins can remove members"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

-- Group messages - consolidate policies
DROP POLICY IF EXISTS "Admins can manage all messages" ON group_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON group_messages;

CREATE POLICY "Group members can view messages"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_messages.group_id
      AND user_id = (select auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Group members can send messages"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_messages.group_id
        AND user_id = (select auth.uid())
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
    )
    AND (select auth.uid()) = user_id
  );

CREATE POLICY "Users and admins can update messages"
  ON group_messages FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Users and admins can delete messages"
  ON group_messages FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

-- Posts - consolidate admin and author policies
DROP POLICY IF EXISTS "Admins can update any post" ON posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON posts;

CREATE POLICY "Admins and authors can update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = author_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  )
  WITH CHECK (
    (select auth.uid()) = author_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Admins and authors can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = author_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND is_admin = true)
  );

-- ============================================================================
-- PART 3: Clean up unused indexes
-- ============================================================================

-- Remove unused indexes that create maintenance overhead
DROP INDEX IF EXISTS idx_group_members_onboarding;
DROP INDEX IF EXISTS idx_posts_scheduling;
DROP INDEX IF EXISTS idx_profiles_user_title;
DROP INDEX IF EXISTS idx_group_messages_group_created;
DROP INDEX IF EXISTS idx_group_messages_user_id;
DROP INDEX IF EXISTS idx_direct_messages_receiver_unread;
DROP INDEX IF EXISTS idx_direct_messages_created;
DROP INDEX IF EXISTS idx_discussion_threads_created_by;
DROP INDEX IF EXISTS idx_saved_articles_post_id;
DROP INDEX IF EXISTS idx_quotes_language;
DROP INDEX IF EXISTS idx_quotes_display_order;
DROP INDEX IF EXISTS idx_quotes_created_by_user;
DROP INDEX IF EXISTS idx_quotes_is_custom;
DROP INDEX IF EXISTS idx_comments_post_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_discussion_groups_created_by;
DROP INDEX IF EXISTS idx_email_stats_post_id;
DROP INDEX IF EXISTS idx_email_stats_subscriber_id;
DROP INDEX IF EXISTS idx_likes_user_id;
DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_user_selected_quotes_quote_id;
DROP INDEX IF EXISTS idx_books_created_by;
DROP INDEX IF EXISTS idx_book_summaries_book_id;
DROP INDEX IF EXISTS idx_book_summaries_admin_id;
DROP INDEX IF EXISTS idx_book_takeaways_book_id;
DROP INDEX IF EXISTS idx_book_takeaways_user_id;
DROP INDEX IF EXISTS idx_user_book_list_user_id;
DROP INDEX IF EXISTS idx_user_book_list_book_id;
DROP INDEX IF EXISTS idx_user_book_list_user_book;
DROP INDEX IF EXISTS idx_profiles_is_admin;
DROP INDEX IF EXISTS idx_admin_actions_log_target_user;
DROP INDEX IF EXISTS idx_admin_actions_log_performed_by;
