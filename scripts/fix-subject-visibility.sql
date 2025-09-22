-- Comprehensive fix for subject visibility issues
-- This addresses RLS policies and ensures subjects are visible to students

-- 1. First, ensure RLS policies on subjects table allow students to read subjects
DROP POLICY IF EXISTS "Anyone can view subjects" ON subjects;
DROP POLICY IF EXISTS "Students can view subjects" ON subjects;
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON subjects;

CREATE POLICY "Anyone can view subjects" ON subjects
  FOR SELECT USING (true);

-- 2. Ensure RLS policies on subject_levels table are correct
DROP POLICY IF EXISTS "Anyone can view subject levels" ON subject_levels;
DROP POLICY IF EXISTS "Admins can manage subject levels" ON subject_levels;

CREATE POLICY "Anyone can view subject levels" ON subject_levels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subject levels" ON subject_levels
  FOR ALL USING (public.is_admin());

-- 3. Create or replace the function to get subjects for a level
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

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_subjects_for_level(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subjects_for_level(UUID) TO anon;

-- 5. Create a simple view for debugging
CREATE OR REPLACE VIEW subjects_with_levels_debug AS
SELECT 
  s.id,
  s.title,
  s.description,
  s.image_url,
  s.level_id as old_level_id,
  ARRAY_AGG(DISTINCT sl.level_id) FILTER (WHERE sl.level_id IS NOT NULL) as new_level_ids,
  ARRAY_AGG(DISTINCT l.title) FILTER (WHERE l.title IS NOT NULL) as new_level_titles,
  lev.title as old_level_title
FROM subjects s
LEFT JOIN subject_levels sl ON s.id = sl.subject_id
LEFT JOIN levels l ON sl.level_id = l.id
LEFT JOIN levels lev ON s.level_id = lev.id
GROUP BY s.id, s.title, s.description, s.image_url, s.level_id, lev.title
ORDER BY s.title;

-- Grant permissions on the debug view
GRANT SELECT ON subjects_with_levels_debug TO authenticated;
GRANT SELECT ON subjects_with_levels_debug TO anon;

-- 6. Test the function with a specific level (replace with actual level ID)
-- This will help us debug what's happening
DO $$
DECLARE
  test_level_id UUID;
  result_count INTEGER;
BEGIN
  -- Get the first level to test with
  SELECT id INTO test_level_id FROM levels LIMIT 1;
  
  -- Test the function
  SELECT COUNT(*) INTO result_count FROM get_subjects_for_level(test_level_id);
  
  RAISE NOTICE 'Test completed: Found % subjects for level %', result_count, test_level_id;
END $$;

SELECT 'Subject visibility fix completed successfully' as status;

