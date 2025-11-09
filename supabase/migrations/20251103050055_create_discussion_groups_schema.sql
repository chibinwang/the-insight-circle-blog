/*
  # Create Discussion Groups Schema

  ## Overview
  Creates a complete private discussion group system for the blog platform.
  Users can join community groups and have real-time conversations about blog topics.

  ## New Tables

  ### discussion_groups
  - `id` (bigint, primary key, auto-increment) - Unique group identifier
  - `name` (text, not null) - Group display name
  - `description` (text) - Group description
  - `category` (text) - Associated blog category (optional)
  - `is_private` (boolean, default true) - Privacy setting
  - `created_by` (uuid, references profiles) - Group creator
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### group_members
  - `id` (bigint, primary key, auto-increment) - Unique membership identifier
  - `group_id` (bigint, references discussion_groups) - Associated group
  - `user_id` (uuid, references profiles) - Member user
  - `role` (text, default 'member') - Member role (admin, moderator, member)
  - `joined_at` (timestamptz) - Join timestamp
  - `last_read_at` (timestamptz) - Last message read timestamp
  - Unique constraint on (group_id, user_id) - One membership per user per group

  ### group_messages
  - `id` (bigint, primary key, auto-increment) - Unique message identifier
  - `group_id` (bigint, references discussion_groups) - Associated group
  - `user_id` (uuid, references profiles) - Message sender
  - `content` (text, not null) - Message content
  - `created_at` (timestamptz) - Send timestamp
  - `updated_at` (timestamptz) - Last edit timestamp
  - `is_deleted` (boolean, default false) - Soft delete flag

  ## Security (Row Level Security)

  ### discussion_groups
  - Public can view all groups (for discovery)
  - Authenticated users can create groups
  - Group creators and admins can update/delete their groups

  ### group_members
  - Members can view other members in their groups
  - Authenticated users can insert themselves as members (join)
  - Users can delete their own membership (leave)
  - Group admins can manage all memberships

  ### group_messages
  - Only group members can view messages
  - Only group members can create messages
  - Users can update/delete their own messages
  - Group admins can delete any message

  ## Indexes
  - Index on group_members (user_id) for user's groups lookup
  - Index on group_messages (group_id, created_at) for efficient message retrieval
*/

-- Create discussion_groups table
CREATE TABLE IF NOT EXISTS discussion_groups (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  is_private boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discussion_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussion groups are viewable by everyone"
  ON discussion_groups FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create discussion groups"
  ON discussion_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
  ON discussion_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON discussion_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage any group"
  ON discussion_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id bigserial PRIMARY KEY,
  group_id bigint REFERENCES discussion_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view other members in their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Group admins can manage members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id bigserial PRIMARY KEY,
  group_id bigint REFERENCES discussion_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view messages"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    )
    AND is_deleted = false
  );

CREATE POLICY "Group members can send messages"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON group_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON group_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Group admins can delete any message"
  ON group_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_user_id ON group_messages(user_id);

-- Create a default general discussion group
INSERT INTO discussion_groups (name, description, category, is_private, created_by)
SELECT 
  '思圈社群討論區',
  '歡迎所有會員加入我們的社群討論區，分享想法、交流心得！',
  NULL,
  false,
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM discussion_groups WHERE name = '思圈社群討論區');