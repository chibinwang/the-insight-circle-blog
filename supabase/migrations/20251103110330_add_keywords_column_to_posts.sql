/*
  # Add Keywords Column to Posts Table

  1. Changes
    - Add keywords column to posts table for SEO optimization
    - Keywords stored as text with comma-separated values or JSON array
    - Column is optional (nullable) to avoid breaking existing posts

  2. Purpose
    - Enable admins to add SEO keywords to blog posts
    - Improve search engine optimization
    - Help with content discoverability
*/

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS keywords TEXT;