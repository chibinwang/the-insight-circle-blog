/*
  # Add edited_at column to group_messages

  ## Changes
  - Add `edited_at` (timestamptz) column to group_messages table
    - Tracks when a message was last edited
    - NULL if message has never been edited
    - Updated automatically when is_edited is set to true
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_messages' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE group_messages ADD COLUMN edited_at timestamptz;
  END IF;
END $$;
