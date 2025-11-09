/*
  # Optimize RLS Policies for Performance

  1. Performance Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale
    
  2. Tables Updated
    - profiles: Update insert, update, and title policies
    - posts: Update all policies (view, insert, update, delete)
    - comments: Update insert and delete policies
    - likes: Update insert and delete policies
    - discussion_groups: Update create, update, delete policies
    - group_messages: Update all policies
    - discussion_threads: Update all policies
    - group_members: Update join and leave policies
    - direct_messages: Update all policies
    - saved_articles: Update all policies
    - user_selected_quotes: Update all policies
    - quotes: Update custom quote policies
    
  3. Important Notes
    - All existing policies are dropped and recreated with optimized pattern
    - Policy logic remains the same, only performance is improved
*/

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own title" ON profiles;
CREATE POLICY "Users can update their own title"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- POSTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON posts;
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  TO public
  USING (
    is_published = true 
    OR author_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Only admins can create posts" ON posts;
CREATE POLICY "Only admins can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Authors can update their own posts" ON posts;
CREATE POLICY "Authors can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authors can delete their own posts" ON posts;
CREATE POLICY "Authors can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update any post" ON posts;
CREATE POLICY "Admins can update any post"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete any post" ON posts;
CREATE POLICY "Admins can delete any post"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- COMMENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- LIKES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create likes" ON likes;
CREATE POLICY "Authenticated users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- DISCUSSION_GROUPS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create discussion groups" ON discussion_groups;
CREATE POLICY "Authenticated users can create discussion groups"
  ON discussion_groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Group creators can update their groups" ON discussion_groups;
CREATE POLICY "Group creators can update their groups"
  ON discussion_groups FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Group creators can delete their groups" ON discussion_groups;
CREATE POLICY "Group creators can delete their groups"
  ON discussion_groups FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage any group" ON discussion_groups;
CREATE POLICY "Admins can manage any group"
  ON discussion_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- GROUP_MESSAGES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
CREATE POLICY "Group members can view messages"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
CREATE POLICY "Group members can send messages"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON group_messages;
CREATE POLICY "Users can update their own messages"
  ON group_messages FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own messages" ON group_messages;
CREATE POLICY "Users can delete their own messages"
  ON group_messages FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all messages" ON group_messages;
CREATE POLICY "Admins can manage all messages"
  ON group_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- DISCUSSION_THREADS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Group members can view threads" ON discussion_threads;
CREATE POLICY "Group members can view threads"
  ON discussion_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = discussion_threads.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Group members can create threads" ON discussion_threads;
CREATE POLICY "Group members can create threads"
  ON discussion_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = discussion_threads.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Thread creators can update their threads" ON discussion_threads;
CREATE POLICY "Thread creators can update their threads"
  ON discussion_threads FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Thread creators can delete their threads" ON discussion_threads;
CREATE POLICY "Thread creators can delete their threads"
  ON discussion_threads FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all threads" ON discussion_threads;
CREATE POLICY "Admins can manage all threads"
  ON discussion_threads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- GROUP_MEMBERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can join groups" ON group_members;
CREATE POLICY "Authenticated users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all group members" ON group_members;
CREATE POLICY "Admins can manage all group members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- DIRECT_MESSAGES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own direct messages" ON direct_messages;
CREATE POLICY "Users can view their own direct messages"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (select auth.uid())
    OR receiver_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can send direct messages" ON direct_messages;
CREATE POLICY "Users can send direct messages"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Senders can update their own messages" ON direct_messages;
CREATE POLICY "Senders can update their own messages"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (sender_id = (select auth.uid()))
  WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Senders can delete their own messages" ON direct_messages;
CREATE POLICY "Senders can delete their own messages"
  ON direct_messages FOR DELETE
  TO authenticated
  USING (sender_id = (select auth.uid()));

-- ============================================================================
-- SAVED_ARTICLES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own saved articles" ON saved_articles;
CREATE POLICY "Users can view their own saved articles"
  ON saved_articles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can save articles" ON saved_articles;
CREATE POLICY "Users can save articles"
  ON saved_articles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can unsave articles" ON saved_articles;
CREATE POLICY "Users can unsave articles"
  ON saved_articles FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- USER_SELECTED_QUOTES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own selected quotes" ON user_selected_quotes;
CREATE POLICY "Users can view their own selected quotes"
  ON user_selected_quotes FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own selected quotes" ON user_selected_quotes;
CREATE POLICY "Users can insert their own selected quotes"
  ON user_selected_quotes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own selected quotes" ON user_selected_quotes;
CREATE POLICY "Users can delete their own selected quotes"
  ON user_selected_quotes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- QUOTES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view predefined and own custom quotes" ON quotes;
CREATE POLICY "Users can view predefined and own custom quotes"
  ON quotes FOR SELECT
  TO public
  USING (
    (is_custom = false AND is_visible = true) 
    OR 
    (is_custom = true AND created_by_user_id = (select auth.uid()) AND is_visible = true)
  );

DROP POLICY IF EXISTS "Users can create their own custom quotes" ON quotes;
CREATE POLICY "Users can create their own custom quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_custom = true 
    AND created_by_user_id = (select auth.uid())
    AND is_visible = true
  );

DROP POLICY IF EXISTS "Users can update their own custom quotes" ON quotes;
CREATE POLICY "Users can update their own custom quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (is_custom = true AND created_by_user_id = (select auth.uid()))
  WITH CHECK (is_custom = true AND created_by_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own custom quotes" ON quotes;
CREATE POLICY "Users can delete their own custom quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (is_custom = true AND created_by_user_id = (select auth.uid()));
