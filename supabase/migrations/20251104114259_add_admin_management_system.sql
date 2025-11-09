/*
  # Admin Management System

  1. Purpose
    - Enable admins to grant admin privileges to other users
    - Track admin invitation and privilege changes

  2. Security Changes
    - Add RLS policy allowing admins to update is_admin field for other profiles
    - Ensure only authenticated admins can modify admin status

  3. New Tables
    - `admin_actions_log`
      - `id` (bigint, primary key, auto-increment)
      - `performed_by` (uuid, references profiles) - Admin who performed the action
      - `target_user_id` (uuid, references profiles) - User who was affected
      - `action_type` (text) - Type of action: 'grant_admin' or 'revoke_admin'
      - `created_at` (timestamptz)

  4. Notes
    - Activity log helps track who granted admin privileges and when
    - Admins can grant admin status to existing users
    - All changes are logged for audit purposes
*/

-- Create admin actions log table
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id bigserial PRIMARY KEY,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('grant_admin', 'revoke_admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions log"
  ON admin_actions_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert into admin actions log"
  ON admin_actions_log FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = performed_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add policy to allow admins to update is_admin field for other profiles
CREATE POLICY "Admins can update admin status for other profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Create index for better performance on admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_target_user ON admin_actions_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_performed_by ON admin_actions_log(performed_by);