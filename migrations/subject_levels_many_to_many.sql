-- Migration: Create many-to-many relationship between subjects and levels
-- This migration allows subjects to be assigned to multiple levels

BEGIN;

-- Create the junction table for subject-level relationships
CREATE TABLE IF NOT EXISTS subject_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subject_id, level_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subject_levels_subject_id ON subject_levels(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_levels_level_id ON subject_levels(level_id);

-- Enable RLS on subject_levels table
ALTER TABLE subject_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subject_levels
-- Everyone can view subject-level relationships
CREATE POLICY "Anyone can view subject levels" ON subject_levels
  FOR SELECT USING (true);

-- Only admins can insert/update/delete subject-level relationships
-- Using the existing is_admin() function
CREATE POLICY "Admins can manage subject levels" ON subject_levels
  FOR ALL USING (public.is_admin());

-- Migrate existing data from subjects.level_id to the new junction table
INSERT INTO subject_levels (subject_id, level_id)
SELECT id, level_id 
FROM subjects 
WHERE level_id IS NOT NULL
ON CONFLICT (subject_id, level_id) DO NOTHING;

-- Remove the old level_id column from subjects table
ALTER TABLE subjects DROP COLUMN IF EXISTS level_id;

-- Create a function to get subjects with their levels
CREATE OR REPLACE FUNCTION get_subjects_with_levels()
RETURNS TABLE (
  subject_id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  level_ids UUID[],
  level_titles TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.image_url,
    s.created_at,
    s.updated_at,
    ARRAY_AGG(sl.level_id) FILTER (WHERE sl.level_id IS NOT NULL) as level_ids,
    ARRAY_AGG(l.title) FILTER (WHERE l.title IS NOT NULL) as level_titles
  FROM subjects s
  LEFT JOIN subject_levels sl ON s.id = sl.subject_id
  LEFT JOIN levels l ON sl.level_id = l.id
  GROUP BY s.id, s.title, s.description, s.image_url, s.created_at, s.updated_at
  ORDER BY s.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get levels for a specific subject
CREATE OR REPLACE FUNCTION get_subject_levels(p_subject_id UUID)
RETURNS TABLE (
  level_id UUID,
  level_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title
  FROM subject_levels sl
  JOIN levels l ON sl.level_id = l.id
  WHERE sl.subject_id = p_subject_id
  ORDER BY l.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get subjects for a specific level
CREATE OR REPLACE FUNCTION get_level_subjects(p_level_id UUID)
RETURNS TABLE (
  subject_id UUID,
  subject_title TEXT,
  subject_description TEXT,
  subject_image_url TEXT,
  subject_created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.image_url,
    s.created_at
  FROM subject_levels sl
  JOIN subjects s ON sl.subject_id = s.id
  WHERE sl.level_id = p_level_id
  ORDER BY s.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_subjects_with_levels() TO authenticated;
GRANT EXECUTE ON FUNCTION get_subject_levels(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_level_subjects(UUID) TO authenticated;

COMMIT;
