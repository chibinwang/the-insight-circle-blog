/*
  # Add Subscriber Categories

  1. Changes
    - Add `category_1` column to subscribers table
      - Type: text
      - Nullable: true
      - Description: First custom category for subscriber segmentation
    - Add `category_2` column to subscribers table
      - Type: text
      - Nullable: true
      - Description: Second custom category for subscriber segmentation
  
  2. Indexes
    - Add indexes on category columns for efficient filtering
  
  3. Security
    - No RLS changes needed - existing policies cover these columns
  
  4. Notes
    - Categories are nullable to allow flexible segmentation
    - Admins can use these to segment subscribers as needed
    - Useful for targeted email campaigns
*/

-- Add category columns to subscribers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'category_1'
  ) THEN
    ALTER TABLE subscribers ADD COLUMN category_1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'category_2'
  ) THEN
    ALTER TABLE subscribers ADD COLUMN category_2 text;
  END IF;
END $$;

-- Add indexes for efficient filtering by categories
CREATE INDEX IF NOT EXISTS idx_subscribers_category_1 ON subscribers(category_1) WHERE category_1 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_category_2 ON subscribers(category_2) WHERE category_2 IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN subscribers.category_1 IS 'First custom category for subscriber segmentation';
COMMENT ON COLUMN subscribers.category_2 IS 'Second custom category for subscriber segmentation';