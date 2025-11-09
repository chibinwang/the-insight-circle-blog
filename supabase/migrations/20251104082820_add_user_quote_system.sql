/*
  # User Quote Selection System

  1. New Tables
    - `quotes`
      - `id` (bigint, primary key, auto-increment)
      - `text_chinese` (text) - Chinese version of the quote
      - `text_english` (text) - English version of the quote
      - `language` (text) - 'chinese' or 'english' to categorize
      - `display_order` (integer) - Order for displaying quotes
      - `created_at` (timestamptz)

    - `user_selected_quotes`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (uuid, references profiles)
      - `quote_id` (bigint, references quotes)
      - `selected_at` (timestamptz)
      - Unique constraint on (user_id, quote_id) to prevent duplicates

  2. Data
    - Populate quotes table with 10 Chinese and 10 English quotes

  3. Security
    - Enable RLS on both tables
    - Anyone can read quotes
    - Users can manage their own selected quotes
*/

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id bigserial PRIMARY KEY,
  text_chinese text,
  text_english text,
  language text NOT NULL CHECK (language IN ('chinese', 'english')),
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotes are viewable by everyone"
  ON quotes FOR SELECT
  TO public
  USING (true);

-- Create user_selected_quotes table
CREATE TABLE IF NOT EXISTS user_selected_quotes (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quote_id bigint REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  selected_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quote_id)
);

ALTER TABLE user_selected_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own selected quotes"
  ON user_selected_quotes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own selected quotes"
  ON user_selected_quotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selected quotes"
  ON user_selected_quotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Populate Chinese quotes
INSERT INTO quotes (text_chinese, text_english, language, display_order) VALUES
('你現在的選擇，決定了未來五年的自己。', NULL, 'chinese', 1),
('別等條件完美，行動本身就是改變的開始。', NULL, 'chinese', 2),
('最強的競爭力，是能在變化中保持清醒。', NULL, 'chinese', 3),
('方向比速度重要，但行動比方向更重要。', NULL, 'chinese', 4),
('別怕起步慢，怕的是永遠沒開始。', NULL, 'chinese', 5),
('真正的自由，是能為自己做選擇。', NULL, 'chinese', 6),
('想改變世界，先改變自己對世界的看法。', NULL, 'chinese', 7),
('沉得住氣的人，才撐得起未來。', NULL, 'chinese', 8),
('最長遠的投資，是投資在自己的腦袋裡。', NULL, 'chinese', 9),
('別追求容易的路，因為它不會帶你去值得的地方。', NULL, 'chinese', 10);

-- Populate English quotes
INSERT INTO quotes (text_chinese, text_english, language, display_order) VALUES
(NULL, 'Discipline will take you places motivation can''t.', 'english', 11),
(NULL, 'Start where you are. Use what you have. Do what you can.', 'english', 12),
(NULL, 'Be obsessed with your growth, not with others'' opinions.', 'english', 13),
(NULL, 'Dream big. Start small. Move fast.', 'english', 14),
(NULL, 'You don''t need more time. You need more focus.', 'english', 15),
(NULL, 'Build something that outlives your ego.', 'english', 16),
(NULL, 'Don''t wait for inspiration. Create it.', 'english', 17),
(NULL, 'You either learn to control your mind, or it controls you.', 'english', 18),
(NULL, 'The future belongs to those who act, not those who scroll.', 'english', 19),
(NULL, 'Your excuses won''t build the life you want. Action will.', 'english', 20);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_selected_quotes_user_id ON user_selected_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_language ON quotes(language);
CREATE INDEX IF NOT EXISTS idx_quotes_display_order ON quotes(display_order);
