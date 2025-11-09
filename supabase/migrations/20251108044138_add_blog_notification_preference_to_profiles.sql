/*
  # Add Blog Notification Preference to Profiles

  1. Changes
    - Add `wants_blog_notifications` column to profiles table
      - Type: boolean
      - Default: false (users must opt-in)
      - Description: Stores user preference for receiving blog notifications and promotional content
  
  2. Security
    - No RLS changes needed - existing policies cover this column
    - Users can update their own profile including this preference
  
  3. Notes
    - Default is false to comply with opt-in best practices
    - This preference will be used to determine if user should be added to subscribers table
    - Existing profiles will have this set to false by default
*/

-- Add wants_blog_notifications column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'wants_blog_notifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN wants_blog_notifications boolean DEFAULT false;
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN profiles.wants_blog_notifications IS 
  'User preference for receiving blog notifications and promotional content from 思圈計畫';