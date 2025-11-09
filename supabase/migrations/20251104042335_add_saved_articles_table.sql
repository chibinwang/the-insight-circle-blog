/*
  # Add Saved Articles Feature

  1. New Tables
    - `saved_articles`
      - `id` (uuid, primary key) - Unique identifier for each saved article record
      - `user_id` (uuid, foreign key) - Reference to the user who saved the article
      - `post_id` (bigint, foreign key) - Reference to the saved post
      - `saved_at` (timestamptz) - Timestamp when the article was saved
      - Composite unique constraint on (user_id, post_id) to prevent duplicate saves

  2. Security
    - Enable RLS on `saved_articles` table
    - Add policy for users to view their own saved articles
    - Add policy for users to save articles (insert)
    - Add policy for users to unsave articles (delete their own saves)

  3. Indexes
    - Index on user_id for faster lookups of user's saved articles
    - Index on post_id for analytics on most saved posts
*/

CREATE TABLE IF NOT EXISTS saved_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_post_id ON saved_articles(post_id);

ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved articles"
  ON saved_articles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save articles"
  ON saved_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave articles"
  ON saved_articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
