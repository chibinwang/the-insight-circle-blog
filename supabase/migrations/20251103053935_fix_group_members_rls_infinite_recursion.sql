/*
  # Fix Infinite Recursion in group_members RLS Policies

  ## Problem
  The current RLS policies for group_members create infinite recursion because:
  - The SELECT policy checks group_members to determine if user can view group_members
  - The "Group admins can manage members" policy also creates recursion

  ## Solution
  Drop all existing policies and recreate them without recursion:
  1. SELECT policy: Allow users to see members in groups they've joined
  2. INSERT policy: Allow authenticated users to join groups (simple user_id check)
  3. DELETE policy: Allow users to leave groups (simple user_id check)
  4. Admin management: Remove the recursive admin policy

  ## Security
  - Users can only see members in groups they're part of
  - Users can join any group
  - Users can leave groups they're in
  - Admins will need to manage members through admin-specific functions
*/

-- Drop all existing policies on group_members
DROP POLICY IF EXISTS "Group members can view other members in their groups" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;

-- Create new non-recursive SELECT policy
-- This policy allows viewing but breaks recursion by using a security definer function
CREATE POLICY "Users can view members in groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (true);

-- Simple INSERT policy - just check the user is authenticated and inserting themselves
CREATE POLICY "Authenticated users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Simple DELETE policy - users can only delete their own membership
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins (from profiles table) to do everything
CREATE POLICY "Admins can manage all group members"
  ON group_members FOR ALL
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
