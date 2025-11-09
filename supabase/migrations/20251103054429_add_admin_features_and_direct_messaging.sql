/*
  # Add Admin Features and Direct Messaging

  ## Overview
  Adds comprehensive admin controls and private messaging system

  ## New Tables

  ### direct_messages
  - `id` (bigint, primary key, auto-increment) - Unique message identifier
  - `sender_id` (uuid, references profiles) - Message sender
  - `receiver_id` (uuid, references profiles) - Message receiver
  - `content` (text, not null) - Message content
  - `is_read` (boolean, default false) - Read status
  - `created_at` (timestamptz) - Send timestamp
  - `updated_at` (timestamptz) - Last edit timestamp
  - `is_deleted` (boolean, default false) - Soft delete flag

  ## Modified Tables

  ### group_messages
  - Update RLS policies to allow admins to edit/delete any message

  ### discussion_threads
  - Update RLS policies to allow admins to manage all threads

  ## Security (Row Level Security)

  ### direct_messages
  - Only sender and receiver can view their messages
  - Only sender can send messages
  - Only sender can edit/delete their own messages
  - Admins can view all messages for moderation

  ## Indexes
  - Index on direct_messages (sender_id, receiver_id, created_at)
  - Index on direct_messages (receiver_id, is_read)
*/

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id bigserial PRIMARY KEY,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Direct messages RLS policies
CREATE POLICY "Users can view their own direct messages"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can send direct messages"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can update their own messages"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can delete their own messages"
  ON direct_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Update group_messages policies to allow admin management
DROP POLICY IF EXISTS "Group admins can delete any message" ON group_messages;

CREATE POLICY "Admins can manage all messages"
  ON group_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Update discussion_threads policies for better admin control
DROP POLICY IF EXISTS "Group admins can manage all threads" ON discussion_threads;

CREATE POLICY "Admins can manage all threads"
  ON discussion_threads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create indexes for direct messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_receiver 
  ON direct_messages(sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_unread 
  ON direct_messages(receiver_id, is_read);

CREATE INDEX IF NOT EXISTS idx_direct_messages_created 
  ON direct_messages(created_at DESC);
