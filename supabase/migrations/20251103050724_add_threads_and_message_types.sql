/*
  # Add Threads and Message Types to Discussion Groups

  ## Overview
  Enhances the discussion group system with threaded conversations and message types
  to create a more organized and feature-rich chat room experience.

  ## New Tables

  ### discussion_threads
  - `id` (bigint, primary key, auto-increment) - Unique thread identifier
  - `group_id` (bigint, references discussion_groups) - Parent group
  - `created_by` (uuid, references profiles) - Thread creator
  - `title` (text, not null) - Thread title/topic
  - `description` (text) - Optional thread description
  - `is_pinned` (boolean, default false) - Pin important threads
  - `is_locked` (boolean, default false) - Lock thread to prevent new messages
  - `message_count` (integer, default 0) - Cached message count
  - `last_activity_at` (timestamptz) - Last message timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ## Modified Tables

  ### group_messages
  - Add `thread_id` (bigint, references discussion_threads) - Parent thread
  - Add `message_type` (text, default 'message') - Message type: 'message', 'announcement', 'system'
  - Add `parent_message_id` (bigint, references group_messages) - For replies
  - Add `is_edited` (boolean, default false) - Edit flag

  ## Security (Row Level Security)

  ### discussion_threads
  - Group members can view threads
  - Group members can create threads
  - Thread creators and group admins can update/delete threads

  ## Indexes
  - Index on discussion_threads (group_id, last_activity_at) for feed sorting
  - Index on group_messages (thread_id, created_at) for thread message retrieval
*/

-- Create discussion_threads table
CREATE TABLE IF NOT EXISTS discussion_threads (
  id bigserial PRIMARY KEY,
  group_id bigint REFERENCES discussion_groups(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  message_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view threads"
  ON discussion_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = discussion_threads.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create threads"
  ON discussion_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = discussion_threads.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Thread creators can update their threads"
  ON discussion_threads FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Thread creators can delete their threads"
  ON discussion_threads FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Group admins can manage all threads"
  ON discussion_threads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = discussion_threads.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- Add new columns to group_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_messages' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE group_messages ADD COLUMN thread_id bigint REFERENCES discussion_threads(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE group_messages ADD COLUMN message_type text DEFAULT 'message';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_messages' AND column_name = 'parent_message_id'
  ) THEN
    ALTER TABLE group_messages ADD COLUMN parent_message_id bigint REFERENCES group_messages(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_messages' AND column_name = 'is_edited'
  ) THEN
    ALTER TABLE group_messages ADD COLUMN is_edited boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussion_threads_group_activity 
  ON discussion_threads(group_id, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_discussion_threads_created_by 
  ON discussion_threads(created_by);

CREATE INDEX IF NOT EXISTS idx_group_messages_thread_created 
  ON group_messages(thread_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_group_messages_parent 
  ON group_messages(parent_message_id);

-- Function to update thread activity and message count
CREATE OR REPLACE FUNCTION update_thread_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
    UPDATE discussion_threads
    SET 
      last_activity_at = NEW.created_at,
      message_count = message_count + 1
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic thread activity updates
DROP TRIGGER IF EXISTS trigger_update_thread_activity ON group_messages;
CREATE TRIGGER trigger_update_thread_activity
  AFTER INSERT ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_activity();

-- Create a general discussion thread as default
INSERT INTO discussion_threads (group_id, created_by, title, description, is_pinned)
SELECT 
  1,
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  '歡迎來到思圈社群',
  '這是一個開放的討論區，歡迎分享你的想法、提問和交流心得！',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM discussion_threads 
  WHERE group_id = 1 AND title = '歡迎來到思圈社群'
);