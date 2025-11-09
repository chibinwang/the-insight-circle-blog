/*
  # Add Custom Quote Support

  1. Schema Changes
    - Add `is_custom` (boolean) to quotes table - distinguishes between predefined and user-created quotes
    - Add `created_by_user_id` (uuid) to quotes table - tracks which user created a custom quote
    - Add `is_visible` (boolean) to quotes table - allows users to soft-delete their custom quotes
    
  2. Security Updates
    - Update RLS policies to allow users to insert their own custom quotes
    - Update RLS policies to allow users to see predefined quotes and their own custom quotes
    - Add policy for users to update their own custom quotes
    
  3. Important Notes
    - Predefined quotes have is_custom = false and created_by_user_id = NULL
    - Custom quotes have is_custom = true and created_by_user_id = user's UUID
    - All existing quotes remain unchanged (is_custom defaults to false)
*/

-- Add new columns to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'is_custom'
  ) THEN
    ALTER TABLE quotes ADD COLUMN is_custom boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN created_by_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE quotes ADD COLUMN is_visible boolean DEFAULT true;
  END IF;
END $$;

-- Drop existing policy and create updated one
DROP POLICY IF EXISTS "Quotes are viewable by everyone" ON quotes;

-- Users can view predefined quotes and their own custom quotes
CREATE POLICY "Users can view predefined and own custom quotes"
  ON quotes FOR SELECT
  TO public
  USING (
    (is_custom = false AND is_visible = true) 
    OR 
    (is_custom = true AND created_by_user_id = auth.uid() AND is_visible = true)
  );

-- Users can insert their own custom quotes
CREATE POLICY "Users can create their own custom quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_custom = true 
    AND created_by_user_id = auth.uid()
    AND is_visible = true
  );

-- Users can update their own custom quotes
CREATE POLICY "Users can update their own custom quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (is_custom = true AND created_by_user_id = auth.uid())
  WITH CHECK (is_custom = true AND created_by_user_id = auth.uid());

-- Users can delete their own custom quotes (soft delete by setting is_visible to false)
CREATE POLICY "Users can delete their own custom quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (is_custom = true AND created_by_user_id = auth.uid());

-- Create index for efficient custom quote queries
CREATE INDEX IF NOT EXISTS idx_quotes_created_by_user ON quotes(created_by_user_id) WHERE is_custom = true;
CREATE INDEX IF NOT EXISTS idx_quotes_is_custom ON quotes(is_custom);
