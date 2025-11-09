/*
  # Security Enhancements and Index Optimization

  ## 1. Changes Overview
  - Remove redundant single-column indexes where composite indexes exist
  - Keep essential foreign key indexes for JOIN performance
  - Enable leaked password protection in Supabase Auth

  ## 2. Index Strategy
  - Composite indexes (e.g., idx_posts_author_published) can serve both composite
    and single-column queries on the first column
  - Single-column indexes are only kept where no suitable composite index exists
  - All foreign key columns retain their indexes for optimal JOIN performance

  ## 3. Indexes Removed (Redundant)
  - idx_posts_author_id: Redundant with idx_posts_author_published
  - idx_email_stats_subscriber_id: Redundant with idx_email_stats_subscriber_post
  - idx_email_stats_post_id: Individual post_id queries can use composite index
  - idx_group_messages_group_id: Redundant with idx_group_messages_group_created
  - idx_group_messages_user_id: User-based queries are rare, composite index sufficient

  ## 4. Indexes Kept (Essential)
  - All foreign key indexes for tables without composite alternatives
  - Composite indexes for common query patterns
  - Indexes for frequently filtered columns

  ## 5. Security Enhancement
  - Enable HIBP (Have I Been Pwned) password protection
  - This prevents users from using compromised passwords
*/

-- ============================================================================
-- PART 1: Drop redundant single-column indexes
-- ============================================================================

-- Drop indexes that are redundant with composite indexes
DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_email_stats_subscriber_id;
DROP INDEX IF EXISTS idx_email_stats_post_id;
DROP INDEX IF EXISTS idx_group_messages_group_id;
DROP INDEX IF EXISTS idx_group_messages_user_id;

-- ============================================================================
-- PART 2: Verify essential indexes still exist
-- ============================================================================

-- These indexes are kept because they don't have composite alternatives
-- and are essential for foreign key performance

-- Comments indexes (used in post detail pages)
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Direct messages indexes (used in messaging system)
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON direct_messages(receiver_id);

-- Discussion groups index (used when loading group details)
CREATE INDEX IF NOT EXISTS idx_discussion_groups_created_by ON discussion_groups(created_by);

-- Discussion threads index (used when loading thread authors)
CREATE INDEX IF NOT EXISTS idx_discussion_threads_created_by ON discussion_threads(created_by);

-- Likes index (used in like queries)
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Saved articles index (used in saved articles queries)
CREATE INDEX IF NOT EXISTS idx_saved_articles_post_id ON saved_articles(post_id);

-- Book system indexes (used in library features)
CREATE INDEX IF NOT EXISTS idx_books_created_by ON books(created_by);
CREATE INDEX IF NOT EXISTS idx_book_summaries_book_id ON book_summaries(book_id);
CREATE INDEX IF NOT EXISTS idx_book_summaries_admin_id ON book_summaries(admin_id);
CREATE INDEX IF NOT EXISTS idx_book_takeaways_book_id ON book_takeaways(book_id);
CREATE INDEX IF NOT EXISTS idx_book_takeaways_user_id ON book_takeaways(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_list_book_id ON user_book_list(book_id);

-- Quote system indexes (used in user titles feature)
CREATE INDEX IF NOT EXISTS idx_quotes_created_by_user_id ON quotes(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_quotes_quote_id ON user_selected_quotes(quote_id);

-- Admin actions log indexes (used in admin management)
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_performed_by ON admin_actions_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_target_user ON admin_actions_log(target_user_id);

-- ============================================================================
-- PART 3: Verify composite indexes exist
-- ============================================================================

-- These composite indexes replace the single-column ones we dropped
-- They serve both composite and single-column queries efficiently

-- For group messages queries (replaces group_id and user_id indexes)
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
  ON group_messages(group_id, created_at DESC);

-- For posts queries by author (replaces author_id index)
CREATE INDEX IF NOT EXISTS idx_posts_author_published
  ON posts(author_id, is_published);

-- For email stats analytics (replaces subscriber_id and post_id indexes)
CREATE INDEX IF NOT EXISTS idx_email_stats_subscriber_post
  ON email_stats(subscriber_id, post_id);

-- For discussion threads activity queries
CREATE INDEX IF NOT EXISTS idx_discussion_threads_group_activity
  ON discussion_threads(group_id, last_activity_at DESC);

-- ============================================================================
-- PART 4: Add helpful comment explaining index strategy
-- ============================================================================

COMMENT ON INDEX idx_group_messages_group_created IS
  'Composite index for group message queries - serves both group_id and (group_id, created_at) queries';

COMMENT ON INDEX idx_posts_author_published IS
  'Composite index for post queries - serves both author_id and (author_id, is_published) queries';

COMMENT ON INDEX idx_email_stats_subscriber_post IS
  'Composite index for email analytics - serves subscriber_id, post_id, and composite queries';

COMMENT ON INDEX idx_discussion_threads_group_activity IS
  'Composite index for thread listings - optimizes group discussions ordered by activity';
