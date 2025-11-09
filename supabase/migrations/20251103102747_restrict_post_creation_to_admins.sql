/*
  # Restrict Post Creation to Admins Only

  1. Changes
    - Drop existing post creation policy that allows all authenticated users
    - Create new policy that only allows admin users to create posts
    - Regular users can still read, comment, and use chat rooms

  2. Security
    - Only users with `is_admin = true` can create blog posts
    - Regular users retain all other permissions (read, comment, chat)
*/

DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;

CREATE POLICY "Only admins can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );