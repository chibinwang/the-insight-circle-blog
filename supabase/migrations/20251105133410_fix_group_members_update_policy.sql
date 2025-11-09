/*
  # Fix Group Members Update Policy
  
  ## Overview
  Adds missing UPDATE policy for group_members table to allow users to update their own
  onboarding completion status. This fixes the issue where the onboarding dialog keeps
  appearing even after users complete it.
  
  ## Problem
  The group_members table was missing an UPDATE policy, which prevented users from updating
  their `has_completed_onboarding` field. This caused the onboarding dialog to appear
  repeatedly for users who had already completed it.
  
  ## Changes Made
  
  ### 1. Add UPDATE Policy for Users
  - Allows authenticated users to update their own group membership records
  - Specifically enables updating the `has_completed_onboarding` field
  - Users can only update their own records (where user_id matches auth.uid())
  
  ### 2. Add UPDATE Policy for Admins
  - Allows admins to update any group membership record
  - Enables admin management of member statuses
  
  ## Security Notes
  - Users can only update their own membership records
  - Admins have full update privileges
  - Policies follow the principle of least privilege
*/

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Users can update own membership" ON group_members;
DROP POLICY IF EXISTS "Admins can update any membership" ON group_members;

-- Add policy for users to update their own membership (including onboarding status)
CREATE POLICY "Users can update own membership"
  ON group_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add policy for admins to update any membership
CREATE POLICY "Admins can update any membership"
  ON group_members FOR UPDATE
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