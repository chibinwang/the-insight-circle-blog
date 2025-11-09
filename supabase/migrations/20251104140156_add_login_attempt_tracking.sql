/*
  # Add Login Attempt Tracking for Rate Limiting

  ## Overview
  This migration creates a system to track failed login attempts and implement
  rate limiting to protect against brute force attacks. This provides security
  without requiring the Supabase Pro plan's HIBP feature.

  ## 1. New Tables

  ### `login_attempts`
  Tracks failed login attempts to implement rate limiting
  - `id` (uuid, primary key) - Unique identifier for each attempt
  - `email` (text, not null) - Email address that attempted to login
  - `ip_address` (text) - IP address of the login attempt (optional)
  - `user_agent` (text) - Browser user agent string (optional)
  - `attempted_at` (timestamptz, default now()) - When the attempt occurred
  - `success` (boolean, default false) - Whether the login was successful

  ### Indexes
  - `idx_login_attempts_email_time` - Composite index for querying attempts by email and time
  - `idx_login_attempts_ip_time` - Composite index for querying attempts by IP and time
  - `idx_login_attempts_attempted_at` - Index for cleanup of old records

  ## 2. Security

  ### Row Level Security (RLS)
  - RLS is enabled on the `login_attempts` table
  - No public access to login attempt data
  - Only authenticated users with admin privileges can view attempt logs
  - System can insert records without authentication (for tracking failed logins)

  ### Policies
  - `system_insert_policy` - Allows the system to insert login attempt records
  - `admin_read_policy` - Only admins can read login attempt data

  ## 3. Functions

  ### `cleanup_old_login_attempts()`
  Automatically removes login attempt records older than 24 hours
  - Prevents database bloat
  - Maintains performance
  - Keeps only relevant security data

  ## 4. Automatic Cleanup

  Login attempts older than 24 hours are considered stale and should be removed.
  This can be called periodically via a cron job or edge function.

  ## 5. Rate Limiting Logic

  The rate limiting will be implemented in the application layer:
  - Count failed attempts for an email in the last 15 minutes
  - Block login if there are 5+ failed attempts
  - Reset counter on successful login
  - Consider both email and IP address for comprehensive protection

  ## 6. Important Notes

  - This table is designed for security monitoring and rate limiting
  - Records are intentionally short-lived (24 hours max)
  - IP addresses are stored for security analysis but are optional
  - This system works entirely within Supabase Free tier
  - No external services or APIs required
*/

-- ============================================================================
-- PART 1: Create login_attempts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  attempted_at timestamptz DEFAULT now() NOT NULL,
  success boolean DEFAULT false NOT NULL
);

-- ============================================================================
-- PART 2: Create indexes for efficient querying
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON login_attempts(ip_address, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at
  ON login_attempts(attempted_at DESC);

-- ============================================================================
-- PART 3: Enable Row Level Security
-- ============================================================================

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: Create RLS Policies
-- ============================================================================

-- Allow system to insert login attempt records (for tracking both successful and failed logins)
-- This policy allows inserts without authentication so the login endpoint can track attempts
CREATE POLICY "Allow system to insert login attempts"
  ON login_attempts
  FOR INSERT
  WITH CHECK (true);

-- Only allow admins to read login attempt data for security monitoring
CREATE POLICY "Admins can read all login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- PART 5: Create cleanup function for old records
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================================================
-- PART 6: Add helpful comments
-- ============================================================================

COMMENT ON TABLE login_attempts IS
  'Tracks login attempts for rate limiting and security monitoring. Records are automatically cleaned up after 24 hours.';

COMMENT ON COLUMN login_attempts.email IS
  'Email address that attempted to login';

COMMENT ON COLUMN login_attempts.ip_address IS
  'IP address of the login attempt for additional security tracking';

COMMENT ON COLUMN login_attempts.success IS
  'Whether the login attempt was successful (used to reset rate limiting)';

COMMENT ON FUNCTION cleanup_old_login_attempts IS
  'Removes login attempt records older than 24 hours to prevent database bloat';
