/*
  # Library System with Books, Summaries, and User Takeaways

  ## Overview
  This migration creates a complete library system where admins can share books, post official summaries,
  and users can write their personal takeaways and maintain their own book lists.

  ## New Tables

  ### 1. `books`
  Stores book information including title, author, cover image, and description.
  - `id` (bigserial, primary key) - Unique book identifier
  - `title` (text, required) - Book title
  - `author` (text, required) - Book author name
  - `cover_image_url` (text, optional) - URL to book cover image
  - `description` (text, optional) - Book description or synopsis
  - `isbn` (text, optional) - ISBN number for the book
  - `created_by` (uuid, foreign key) - Admin who added the book
  - `created_at` (timestamptz) - When the book was added
  - `updated_at` (timestamptz) - Last update time

  ### 2. `book_summaries`
  Stores admin-written summaries that are pinned at the top of each book page.
  - `id` (bigserial, primary key) - Unique summary identifier
  - `book_id` (bigint, foreign key) - Reference to the book
  - `admin_id` (uuid, foreign key) - Admin who wrote the summary
  - `content` (text, required) - Summary content (supports rich text)
  - `created_at` (timestamptz) - When the summary was created
  - `updated_at` (timestamptz) - Last update time

  ### 3. `book_takeaways`
  Stores user-submitted takeaways and reflections on books.
  - `id` (bigserial, primary key) - Unique takeaway identifier
  - `book_id` (bigint, foreign key) - Reference to the book
  - `user_id` (uuid, foreign key) - User who wrote the takeaway
  - `content` (text, required) - Takeaway content
  - `created_at` (timestamptz) - When the takeaway was created
  - `updated_at` (timestamptz) - Last update time

  ### 4. `user_book_list`
  Tracks books added to users' personal reading lists (separate from saved articles).
  - `id` (bigserial, primary key) - Unique list entry identifier
  - `user_id` (uuid, foreign key) - User who added the book
  - `book_id` (bigint, foreign key) - Reference to the book
  - `added_at` (timestamptz) - When the book was added to the list

  ## Security (RLS Policies)

  ### Books Table
  - All authenticated users can view books
  - Only admins can create, update, or delete books

  ### Book Summaries Table
  - All authenticated users can view summaries
  - Only admins can create, update, or delete summaries

  ### Book Takeaways Table
  - All authenticated users can view takeaways
  - Authenticated users can create their own takeaways
  - Users can update or delete only their own takeaways

  ### User Book List Table
  - Users can view only their own book list
  - Users can add books to their own list
  - Users can remove books from their own list

  ## Indexes
  - Foreign key indexes for optimal join performance
  - Index on user_book_list (user_id, book_id) for quick lookups
  - Index on book_takeaways (book_id) for efficient takeaway retrieval
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  cover_image_url text,
  description text,
  isbn text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create book_summaries table (admin-written summaries)
CREATE TABLE IF NOT EXISTS book_summaries (
  id bigserial PRIMARY KEY,
  book_id bigint NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create book_takeaways table (user-written takeaways)
CREATE TABLE IF NOT EXISTS book_takeaways (
  id bigserial PRIMARY KEY,
  book_id bigint NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_book_list table (user's personal book list)
CREATE TABLE IF NOT EXISTS user_book_list (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id bigint NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_created_by ON books(created_by);
CREATE INDEX IF NOT EXISTS idx_book_summaries_book_id ON book_summaries(book_id);
CREATE INDEX IF NOT EXISTS idx_book_summaries_admin_id ON book_summaries(admin_id);
CREATE INDEX IF NOT EXISTS idx_book_takeaways_book_id ON book_takeaways(book_id);
CREATE INDEX IF NOT EXISTS idx_book_takeaways_user_id ON book_takeaways(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_list_user_id ON user_book_list(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_list_book_id ON user_book_list(book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_list_user_book ON user_book_list(user_id, book_id);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_takeaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_book_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for books table
CREATE POLICY "Anyone can view books"
  ON books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update books"
  ON books FOR UPDATE
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

CREATE POLICY "Only admins can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for book_summaries table
CREATE POLICY "Anyone can view book summaries"
  ON book_summaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create book summaries"
  ON book_summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update book summaries"
  ON book_summaries FOR UPDATE
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

CREATE POLICY "Only admins can delete book summaries"
  ON book_summaries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for book_takeaways table
CREATE POLICY "Anyone can view book takeaways"
  ON book_takeaways FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create book takeaways"
  ON book_takeaways FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book takeaways"
  ON book_takeaways FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book takeaways"
  ON book_takeaways FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_book_list table
CREATE POLICY "Users can view their own book list"
  ON user_book_list FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add books to their own list"
  ON user_book_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove books from their own list"
  ON user_book_list FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_summaries_updated_at
  BEFORE UPDATE ON book_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_takeaways_updated_at
  BEFORE UPDATE ON book_takeaways
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();