/*
  # Add Onboarding Status to Group Members

  ## Overview
  Adds tracking for first-time member onboarding completion to ensure new community members
  go through the welcome flow and understand community guidelines before participating.

  ## Changes Made

  ### 1. New Column
  - Added `has_completed_onboarding` (boolean, default false) to `group_members` table
    - Tracks whether a member has completed the onboarding flow
    - Defaults to false for all new members
    - Set to true after user completes the 4-step onboarding process

  ### 2. Performance Optimization
  - Added index on `has_completed_onboarding` column for efficient querying

  ## Important Notes
  - Existing members will have `has_completed_onboarding` set to NULL, which should be treated as true
  - New members joining after this migration will have the column set to false by default
  - The onboarding flow only triggers when this value is false
*/

-- Add has_completed_onboarding column to group_members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'has_completed_onboarding'
  ) THEN
    ALTER TABLE group_members 
    ADD COLUMN has_completed_onboarding boolean DEFAULT false;
  END IF;
END $$;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_group_members_onboarding 
ON group_members(has_completed_onboarding);

-- Set existing members as having completed onboarding (they joined before this feature)
UPDATE group_members 
SET has_completed_onboarding = true 
WHERE has_completed_onboarding IS NULL;