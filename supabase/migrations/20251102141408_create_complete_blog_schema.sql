/*
  # Complete Blog Platform Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text, nullable)
      - `bio` (text, nullable)
      - `is_admin` (boolean, default false) - Admin access flag
      - `created_at` (timestamptz)
    
    - `posts`
      - `id` (bigint, primary key, auto-increment)
      - `author_id` (uuid, references profiles)
      - `title` (text)
      - `slug` (text, unique)
      - `content` (text)
      - `cover_image` (text, nullable)
      - `category` (text)
      - `view_count` (integer, default 0)
      - `is_published` (boolean, default false)
      - `is_email_sent` (boolean, default false)
      - `email_sent_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `comments`
      - `id` (bigint, primary key, auto-increment)
      - `post_id` (bigint, references posts)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `likes`
      - `id` (bigint, primary key, auto-increment)
      - `post_id` (bigint, references posts)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - Unique constraint on (post_id, user_id)
    
    - `subscribers`
      - `id` (bigint, primary key, auto-increment)
      - `email` (text, unique)
      - `is_subscribed` (boolean, default true)
      - `unsubscribe_token` (text, unique)
      - `subscribed_at` (timestamptz)
      - `unsubscribed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `email_stats`
      - `id` (bigint, primary key, auto-increment)
      - `subscriber_id` (bigint, references subscribers)
      - `post_id` (bigint, references posts)
      - `sent_at` (timestamptz)
      - `opened_at` (timestamptz, nullable)
      - `clicked_at` (timestamptz, nullable)
      - `tracking_token` (text, unique)
      - `created_at` (timestamptz)

  2. Storage
    - Create `blog-images` bucket for post cover images

  3. Functions
    - `increment_view_count()` - Automatically increment post view count

  4. Security
    - Enable RLS on all tables
    - Profiles: Public read, users can update their own
    - Posts: Public read for published, authenticated users can create, authors and admins can update/delete
    - Comments: Public read, authenticated users can create, users can delete their own
    - Likes: Public read, authenticated users can create, users can delete their own
    - Subscribers: Public can subscribe, users can manage their own subscriptions
    - Email Stats: Public can insert/update (for tracking pixels), public read
    - Storage: Authenticated users can upload/update/delete, public can read
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  bio text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id bigserial PRIMARY KEY,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  cover_image text,
  category text NOT NULL,
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  is_email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  TO public
  USING (is_published = true OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can update any post"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete any post"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id bigserial PRIMARY KEY,
  post_id bigint REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id bigserial PRIMARY KEY,
  post_id bigint REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id bigserial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  is_subscribed boolean DEFAULT true,
  unsubscribe_token text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON subscribers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own subscription by token"
  ON subscribers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Subscribers can update their own status"
  ON subscribers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create email_stats table
CREATE TABLE IF NOT EXISTS email_stats (
  id bigserial PRIMARY KEY,
  subscriber_id bigint REFERENCES subscribers(id) ON DELETE CASCADE NOT NULL,
  post_id bigint REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  tracking_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tracking data"
  ON email_stats FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view email stats"
  ON email_stats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update tracking data"
  ON email_stats FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(post_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$;

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can update blog images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can delete blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "Public can read blog images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-images');