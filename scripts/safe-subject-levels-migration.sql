-- Safe migration that keeps the old level_id column
-- This ensures backward compatibility while adding the new many-to-many functionality

-- 1. First, make sure all existing data is in subject_levels table
INSERT INTO subject_levels (subject_id, level_id)
SELECT id, level_id 
FROM subjects 
WHERE level_id IS NOT NULL
ON CONFLICT (subject_id, level_id) DO NOTHING;

-- 2. Fix RLS policies for subject_levels table
DROP POLICY IF EXISTS "Anyone can view subject levels" ON subject_levels;
DROP POLICY IF EXISTS "Admins can manage subject levels" ON subject_levels;

CREATE POLICY "Anyone can view subject levels" ON subject_levels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subject levels" ON subject_levels
  FOR ALL USING (public.is_admin());

-- 3. Create a view that combines both old and new data
CREATE OR REPLACE VIEW subjects_with_all_levels AS
SELECT DISTINCT
  s.id,
  s.title,
  s.description,
  s.image_url,
  s.created_at,
  s.updated_at,
  COALESCE(
    ARRAY_AGG(DISTINCT sl.level_id) FILTER (WHERE sl.level_id IS NOT NULL),
    CASE WHEN s.level_id IS NOT NULL THEN ARRAY[s.level_id] ELSE ARRAY[]::UUID[] END
  ) as level_ids,
  COALESCE(
    ARRAY_AGG(DISTINCT l.title) FILTER (WHERE l.title IS NOT NULL),
    CASE WHEN s.level_id IS NOT NULL THEN ARRAY[lev.title] ELSE ARRAY[]::TEXT[] END
  ) as level_titles
FROM subjects s
LEFT JOIN subject_levels sl ON s.id = sl.subject_id
LEFT JOIN levels l ON sl.level_id = l.id
LEFT JOIN levels lev ON s.level_id = lev.id
GROUP BY s.id, s.title, s.description, s.image_url, s.created_at, s.updated_at, s.level_id, lev.title;

-- 4. Create a function to get subjects for a specific level (handles both old and new data)
CREATE OR REPLACE FUNCTION get_subjects_for_level(target_level_id UUID)
RETURNS TABLE (
  id UUID,
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
    COALESCE(
      ARRAY_AGG(DISTINCT sl.level_id) FILTER (WHERE sl.level_id IS NOT NULL),
      CASE WHEN s.level_id IS NOT NULL THEN ARRAY[s.level_id] ELSE ARRAY[]::UUID[] END
    ) as level_ids,
    COALESCE(
      ARRAY_AGG(DISTINCT l.title) FILTER (WHERE l.title IS NOT NULL),
      CASE WHEN s.level_id IS NOT NULL THEN ARRAY[lev.title] ELSE ARRAY[]::TEXT[] END
    ) as level_titles
  FROM subjects s
  LEFT JOIN subject_levels sl ON s.id = sl.subject_id
  LEFT JOIN levels l ON sl.level_id = l.id
  LEFT JOIN levels lev ON s.level_id = lev.id
  WHERE 
    -- Include subjects that have the target level in the new many-to-many table
    sl.level_id = target_level_id
    OR 
    -- Include subjects that have the target level in the old single level_id column
    s.level_id = target_level_id
  GROUP BY s.id, s.title, s.description, s.image_url, s.created_at, s.updated_at, s.level_id, lev.title
  ORDER BY s.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_subjects_for_level(UUID) TO authenticated;
GRANT SELECT ON subjects_with_all_levels TO authenticated;

SELECT 'Safe migration completed successfully' as status;
