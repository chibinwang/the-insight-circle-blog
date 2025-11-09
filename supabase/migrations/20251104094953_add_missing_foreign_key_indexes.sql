/*
  # Add Missing Foreign Key Indexes

  1. Performance Optimization
    - Add indexes on all foreign key columns that are missing covering indexes
    - This improves query performance for JOIN operations and foreign key lookups
    
  2. Tables Updated
    - comments: Add indexes on post_id and user_id
    - discussion_groups: Add index on created_by
    - email_stats: Add indexes on post_id and subscriber_id
    - likes: Add index on user_id
    - posts: Add index on author_id
    - user_selected_quotes: Add index on quote_id
    
  3. Important Notes
    - These indexes significantly improve query performance for foreign key relationships
    - Indexes are created with IF NOT EXISTS to avoid errors on re-run
*/

-- Add index for comments.post_id foreign key
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Add index for comments.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Add index for discussion_groups.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_discussion_groups_created_by ON discussion_groups(created_by);

-- Add index for email_stats.post_id foreign key
CREATE INDEX IF NOT EXISTS idx_email_stats_post_id ON email_stats(post_id);

-- Add index for email_stats.subscriber_id foreign key
CREATE INDEX IF NOT EXISTS idx_email_stats_subscriber_id ON email_stats(subscriber_id);

-- Add index for likes.user_id foreign key (post_id already has unique constraint which creates index)
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Add index for posts.author_id foreign key
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- Add index for user_selected_quotes.quote_id foreign key (user_id already indexed)
CREATE INDEX IF NOT EXISTS idx_user_selected_quotes_quote_id ON user_selected_quotes(quote_id);
