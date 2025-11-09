/*
  # Add Post Scheduling System

  ## Overview
  Adds comprehensive scheduling capabilities for blog posts, including automatic publication
  of scheduled posts at the designated time.

  ## Modified Tables

  ### posts
  - Add `scheduled_publish_at` (timestamptz, nullable) - When the post should be auto-published
  - Add `scheduling_status` (text) - Current scheduling state: 'immediate', 'scheduled', 'published', 'draft'
  
  ## New Functions
  
  ### auto_publish_scheduled_posts()
  - Automatically publishes posts when their scheduled time arrives
  - Updates is_published to true and scheduling_status to 'published'
  - Returns count of posts published
  
  ## Indexes
  - Index on (scheduling_status, scheduled_publish_at) for efficient scheduled post queries
  
  ## Important Notes
  - Posts with scheduling_status = 'scheduled' and scheduled_publish_at <= now() will be auto-published
  - The function can be called via a cron job or edge function every minute
  - Existing posts will default to scheduling_status = 'immediate' if published, 'draft' if not
*/

-- Add new columns to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'scheduled_publish_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN scheduled_publish_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'scheduling_status'
  ) THEN
    ALTER TABLE posts ADD COLUMN scheduling_status text DEFAULT 'draft';
  END IF;
END $$;

-- Update existing posts to have proper scheduling_status
UPDATE posts 
SET scheduling_status = CASE 
  WHEN is_published = true THEN 'published'
  ELSE 'draft'
END
WHERE scheduling_status IS NULL OR scheduling_status = 'draft';

-- Create index for efficient scheduled post queries
CREATE INDEX IF NOT EXISTS idx_posts_scheduling 
  ON posts(scheduling_status, scheduled_publish_at) 
  WHERE scheduling_status = 'scheduled';

-- Create function to auto-publish scheduled posts
CREATE OR REPLACE FUNCTION auto_publish_scheduled_posts()
RETURNS TABLE(published_count integer, published_post_ids bigint[]) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_ids bigint[];
  update_count integer;
BEGIN
  -- Update posts that are scheduled and past their publish time
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
  
  -- Return results
  RETURN QUERY SELECT 
    COALESCE(update_count, 0) as published_count,
    COALESCE(updated_ids, ARRAY[]::bigint[]) as published_post_ids;
END;
$$;

-- Grant execute permission to authenticated users (for edge function)
GRANT EXECUTE ON FUNCTION auto_publish_scheduled_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_publish_scheduled_posts() TO service_role;
