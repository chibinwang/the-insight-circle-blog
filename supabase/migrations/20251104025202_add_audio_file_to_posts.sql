/*
  # Add Audio File Support to Posts

  1. Changes
    - Add `audio_file_url` column to `posts` table
      - Type: text (nullable)
      - Purpose: Store URL of uploaded audio file that complements the article
  
  2. Storage
    - Create `blog-audio` bucket for audio files
    - Configure storage policies for authenticated uploads and public reads
  
  3. Security
    - Authenticated users can upload, update, and delete audio files
    - Public can read/access audio files for playback
*/

-- Add audio_file_url column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'audio_file_url'
  ) THEN
    ALTER TABLE posts ADD COLUMN audio_file_url text;
  END IF;
END $$;

-- Create storage bucket for blog audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-audio', 'blog-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files
CREATE POLICY "Authenticated users can upload blog audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-audio');

CREATE POLICY "Authenticated users can update blog audio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-audio')
  WITH CHECK (bucket_id = 'blog-audio');

CREATE POLICY "Authenticated users can delete blog audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-audio');

CREATE POLICY "Public can read blog audio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-audio');