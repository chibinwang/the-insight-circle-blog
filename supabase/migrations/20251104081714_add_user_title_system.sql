/*
  # User Title and Badge System

  1. Schema Changes
    - Add `user_title` column to `profiles` table
      - Type: text (nullable)
      - Valid values: 'dream_seeker', 'path_builder', 'creator', 'strategist', 'insight_leader'
      - Default: null for non-admin users
    
  2. Title Descriptions
    - dream_seeker: 夢想家 (Dream Seeker) - For those finding direction and passion in life
    - path_builder: 行動者 (Path Builder) - For those planning their path and realizing their dreams
    - creator: 創局者 (Creator/Builder) - For those with early business ventures building their value system
    - strategist: 策略家 (Strategist) - For rational planners who leverage resources and time
    - insight_leader: 思行者 (Insight Leader) - For admin users only

  3. Triggers
    - Auto-assign 'insight_leader' title to users when is_admin is set to true
    - Update existing admin users to have 'insight_leader' title

  4. Security
    - Users can update their own user_title field
    - Only non-admin users can change their title
    - Admin users are locked to 'insight_leader' title
*/

-- Add user_title column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_title text;
  END IF;
END $$;

-- Add CHECK constraint to validate title values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'valid_user_title'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT valid_user_title
    CHECK (user_title IN ('dream_seeker', 'path_builder', 'creator', 'strategist', 'insight_leader') OR user_title IS NULL);
  END IF;
END $$;

-- Create index on user_title for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_title ON profiles(user_title);

-- Update existing admin users to have 'insight_leader' title
UPDATE profiles
SET user_title = 'insight_leader'
WHERE is_admin = true AND user_title IS NULL;

-- Create trigger function to auto-assign insight_leader title to admin users
CREATE OR REPLACE FUNCTION set_admin_title()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is set as admin, automatically set their title to insight_leader
  IF NEW.is_admin = true THEN
    NEW.user_title := 'insight_leader';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function on INSERT and UPDATE
DROP TRIGGER IF EXISTS set_admin_title_trigger ON profiles;
CREATE TRIGGER set_admin_title_trigger
  BEFORE INSERT OR UPDATE OF is_admin ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_title();

-- Add RLS policy to allow users to update their own title
CREATE POLICY "Users can update their own title"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent non-admins from setting insight_leader title
    (user_title != 'insight_leader' OR is_admin = true)
  );