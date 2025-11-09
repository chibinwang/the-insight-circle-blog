/*
  # Fix Books RLS Policy for Anonymous Users

  ## Problem
  The current RLS policy on the `books` table only allows authenticated users to view books.
  This causes issues on the famous people booklist pages where anonymous users should be able
  to browse book recommendations but the books join returns null due to RLS restrictions.

  ## Changes
  1. Drop the existing "Anyone can view books" policy (which only applies to authenticated users)
  2. Create a new policy that allows both authenticated AND anonymous users to view books
  3. This aligns with the business requirement that famous people booklists should be publicly viewable

  ## Security Note
  This change only affects SELECT operations. All write operations (INSERT, UPDATE, DELETE)
  remain restricted to admins only. Books are considered public content that anyone should
  be able to browse.
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view books" ON books;

-- Create a new policy that allows anonymous users to view books
CREATE POLICY "Anyone can view books"
  ON books FOR SELECT
  USING (true);
