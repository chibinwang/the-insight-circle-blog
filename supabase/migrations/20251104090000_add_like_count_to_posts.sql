/*
  # Add Like Count to Posts

  1. Schema Changes
    - Add `like_count` column to `posts` table
      - `like_count` (integer, default 0) - Tracks total number of likes for efficient sorting

  2. Functions
    - `update_post_like_count()` - Trigger function to automatically update like_count when likes are added/removed
    - `sync_existing_like_counts()` - One-time function to populate like_count for existing posts

  3. Triggers
    - Create trigger on `likes` table to automatically update post like_count on INSERT/DELETE

  4. Indexes
    - Add index on `like_count` column for optimized sorting by popularity

  5. Important Notes
    - The like_count column provides denormalized data for performance
    - Automatically kept in sync with the likes table through triggers
    - Allows efficient sorting without expensive JOIN operations
*/

-- Add like_count column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN like_count integer DEFAULT 0;
  END IF;
END $$;

-- Create index on like_count for efficient sorting
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count DESC);

-- Create index on combined popularity metrics (like_count + view_count)
CREATE INDEX IF NOT EXISTS idx_posts_popularity ON posts(like_count DESC, view_count DESC);

-- Create function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to automatically update like_count
DROP TRIGGER IF EXISTS trigger_update_post_like_count ON likes;
CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- Sync existing like counts for all posts
CREATE OR REPLACE FUNCTION sync_existing_like_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET like_count = (
    SELECT COUNT(*)
    FROM likes
    WHERE likes.post_id = posts.id
  );
END;
$$;

-- Execute the sync function to populate like_count for existing posts
SELECT sync_existing_like_counts();
