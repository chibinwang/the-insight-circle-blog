/*
  # Famous People Book Lists Feature

  ## Overview
  This migration creates a system for admins to categorize and showcase famous people's book lists.
  Users can browse curated reading recommendations from influential people, providing social proof
  and inspiration for book discovery.

  ## New Tables

  ### 1. `famous_people`
  Stores information about famous people whose book recommendations are featured.
  - `id` (bigserial, primary key) - Unique identifier
  - `name` (text, required) - Full name of the famous person
  - `bio` (text, optional) - Biography or description
  - `profile_image_url` (text, optional) - URL to profile/portrait image
  - `category` (text, optional) - Field or category (e.g., "Business Leader", "Author", "Scientist")
  - `display_order` (integer) - Order for displaying on listing pages
  - `is_published` (boolean) - Whether to show publicly (allows drafts)
  - `created_by` (uuid, foreign key) - Admin who created the entry
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `famous_people_books`
  Junction table linking famous people to their recommended books.
  - `id` (bigserial, primary key) - Unique identifier
  - `famous_person_id` (bigint, foreign key) - Reference to famous person
  - `book_id` (bigint, foreign key) - Reference to book in library
  - `display_order` (integer) - Order of book within person's list
  - `recommendation_note` (text, optional) - Optional note about why they recommend this book
  - `added_by` (uuid, foreign key) - Admin who added this book to the list
  - `added_at` (timestamptz) - When book was added to list

  ## Security (RLS Policies)

  ### Famous People Table
  - All users (including unauthenticated) can view published famous people
  - Only admins can create, update, or delete famous people entries

  ### Famous People Books Table
  - All users (including unauthenticated) can view book recommendations
  - Only admins can add or remove books from famous people's lists

  ## Indexes
  - Foreign key indexes for optimal join performance
  - Index on display_order for efficient sorting
  - Unique constraint on (famous_person_id, book_id) to prevent duplicate recommendations
*/

-- Create famous_people table
CREATE TABLE IF NOT EXISTS famous_people (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  bio text,
  profile_image_url text,
  category text,
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create famous_people_books junction table
CREATE TABLE IF NOT EXISTS famous_people_books (
  id bigserial PRIMARY KEY,
  famous_person_id bigint NOT NULL REFERENCES famous_people(id) ON DELETE CASCADE,
  book_id bigint NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  recommendation_note text,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(famous_person_id, book_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_famous_people_display_order ON famous_people(display_order);
CREATE INDEX IF NOT EXISTS idx_famous_people_is_published ON famous_people(is_published);
CREATE INDEX IF NOT EXISTS idx_famous_people_category ON famous_people(category);
CREATE INDEX IF NOT EXISTS idx_famous_people_created_by ON famous_people(created_by);
CREATE INDEX IF NOT EXISTS idx_famous_people_books_famous_person_id ON famous_people_books(famous_person_id);
CREATE INDEX IF NOT EXISTS idx_famous_people_books_book_id ON famous_people_books(book_id);
CREATE INDEX IF NOT EXISTS idx_famous_people_books_display_order ON famous_people_books(display_order);

-- Enable Row Level Security
ALTER TABLE famous_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE famous_people_books ENABLE ROW LEVEL SECURITY;

-- RLS Policies for famous_people table
CREATE POLICY "Anyone can view published famous people"
  ON famous_people FOR SELECT
  USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Only admins can create famous people"
  ON famous_people FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update famous people"
  ON famous_people FOR UPDATE
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

CREATE POLICY "Only admins can delete famous people"
  ON famous_people FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for famous_people_books table
CREATE POLICY "Anyone can view famous people book recommendations"
  ON famous_people_books FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM famous_people
      WHERE famous_people.id = famous_people_books.famous_person_id
      AND (famous_people.is_published = true OR auth.role() = 'authenticated')
    )
  );

CREATE POLICY "Only admins can add books to famous people lists"
  ON famous_people_books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update famous people book recommendations"
  ON famous_people_books FOR UPDATE
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

CREATE POLICY "Only admins can remove books from famous people lists"
  ON famous_people_books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Triggers to automatically update updated_at for famous_people
CREATE TRIGGER update_famous_people_updated_at
  BEFORE UPDATE ON famous_people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
