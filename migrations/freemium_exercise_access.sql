-- Migration: Freemium Exercise Access Model
-- This migration implements a freemium model where:
-- 1. All authenticated users can see exercise metadata (name, difficulty, etc.)
-- 2. Only premium users can access actual content (files)
-- 3. Public exercises are fully accessible to everyone

BEGIN;

-- ========================================
-- 1. UPDATE EXERCISE RLS POLICIES
-- ========================================

-- Drop existing exercise policies
DROP POLICY IF EXISTS "Admin full access to exercises" ON public.exercises;
DROP POLICY IF EXISTS "Public exercises readable by authenticated users" ON public.exercises;
DROP POLICY IF EXISTS "Private exercises for active students only" ON public.exercises;

-- New comprehensive exercise policies for freemium model

-- 1. Admins have full access to all exercises
CREATE POLICY "Admin full access to exercises" ON public.exercises
  FOR ALL USING (public.is_admin());

-- 2. All authenticated users can see exercise metadata (for browsing)
-- This allows showing exercise cards with name, difficulty, etc. but not file content
CREATE POLICY "All users can view exercise metadata" ON public.exercises
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Note: The actual file content restriction will be handled at the application level
-- or through specific functions that check subscription status

-- ========================================
-- 2. CREATE FREEMIUM HELPER FUNCTIONS
-- ========================================

-- Function to get exercise metadata (always accessible to authenticated users)
CREATE OR REPLACE FUNCTION public.get_exercise_metadata()
RETURNS TABLE (
  id UUID,
  name TEXT,
  tag INTEGER,
  difficulty TEXT,
  chapter_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_public BOOLEAN,
  chapter_title TEXT,
  subject_title TEXT,
  level_title TEXT,
  can_access_content BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.tag,
    e.difficulty,
    e.chapter_id,
    e.created_at,
    e.updated_at,
    e.is_public,
    c.title as chapter_title,
    s.title as subject_title,
    l.title as level_title,
    -- Determine if user can access full content
    CASE 
      WHEN public.is_admin() THEN true
      WHEN e.is_public = true THEN true
      WHEN public.has_active_subscription() THEN true
      ELSE false
    END as can_access_content
  FROM public.exercises e
  LEFT JOIN public.chapters c ON e.chapter_id = c.id
  LEFT JOIN public.subjects s ON c.subject_id = s.id
  LEFT JOIN public.levels l ON s.level_id = l.id
  ORDER BY e.created_at DESC;
END;
$$;

-- Function to get full exercise content (only for premium users)
CREATE OR REPLACE FUNCTION public.get_exercise_content(exercise_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tag INTEGER,
  difficulty TEXT,
  chapter_id UUID,
  exercise_file_urls TEXT[],
  correction_file_urls TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_public BOOLEAN,
  chapter_title TEXT,
  subject_title TEXT,
  level_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_exercise_public BOOLEAN;
  user_has_access BOOLEAN;
BEGIN
  -- Check if exercise exists and get its public status
  SELECT e.is_public INTO is_exercise_public
  FROM public.exercises e
  WHERE e.id = exercise_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exercise not found';
  END IF;
  
  -- Determine if user has access to full content
  user_has_access := (
    public.is_admin() OR 
    is_exercise_public = true OR 
    public.has_active_subscription()
  );
  
  IF NOT user_has_access THEN
    RAISE EXCEPTION 'Premium subscription required to access this exercise content';
  END IF;
  
  -- Return full exercise content
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.tag,
    e.difficulty,
    e.chapter_id,
    e.exercise_file_urls,
    e.correction_file_urls,
    e.created_at,
    e.updated_at,
    e.is_public,
    c.title as chapter_title,
    s.title as subject_title,
    l.title as level_title
  FROM public.exercises e
  LEFT JOIN public.chapters c ON e.chapter_id = c.id
  LEFT JOIN public.subjects s ON c.subject_id = s.id
  LEFT JOIN public.levels l ON s.level_id = l.id
  WHERE e.id = exercise_id;
END;
$$;

-- Function to check if user can access specific exercise content
CREATE OR REPLACE FUNCTION public.can_access_exercise_content(exercise_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_exercise_public BOOLEAN;
BEGIN
  -- Admin access
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  
  -- Check if exercise is public
  SELECT is_public INTO is_exercise_public
  FROM public.exercises
  WHERE id = exercise_id;
  
  -- Return true if public or user has active subscription
  RETURN (is_exercise_public = true OR public.has_active_subscription());
END;
$$;

-- ========================================
-- 3. CREATE FREEMIUM VIEWS
-- ========================================

-- View for exercise previews (metadata only)
CREATE OR REPLACE VIEW public.exercise_previews AS
SELECT 
  e.id,
  e.name,
  e.tag,
  e.difficulty,
  e.chapter_id,
  e.created_at,
  e.updated_at,
  e.is_public,
  c.title as chapter_title,
  s.title as subject_title,
  l.title as level_title,
  -- Show if content is accessible
  CASE 
    WHEN public.is_admin() THEN true
    WHEN e.is_public = true THEN true
    WHEN public.has_active_subscription() THEN true
    ELSE false
  END as can_access_content,
  -- Show lock status
  CASE 
    WHEN public.is_admin() THEN 'admin'
    WHEN e.is_public = true THEN 'public'
    WHEN public.has_active_subscription() THEN 'unlocked'
    ELSE 'locked'
  END as access_status
FROM public.exercises e
LEFT JOIN public.chapters c ON e.chapter_id = c.id
LEFT JOIN public.subjects s ON c.subject_id = s.id
LEFT JOIN public.levels l ON s.level_id = l.id;

-- View for accessible exercise content (full content for premium users)
CREATE OR REPLACE VIEW public.accessible_exercises AS
SELECT 
  e.id,
  e.name,
  e.tag,
  e.difficulty,
  e.chapter_id,
  CASE 
    WHEN public.is_admin() OR e.is_public = true OR public.has_active_subscription() 
    THEN e.exercise_file_urls 
    ELSE NULL 
  END as exercise_file_urls,
  CASE 
    WHEN public.is_admin() OR e.is_public = true OR public.has_active_subscription() 
    THEN e.correction_file_urls 
    ELSE NULL 
  END as correction_file_urls,
  e.created_at,
  e.updated_at,
  e.is_public,
  c.title as chapter_title,
  s.title as subject_title,
  l.title as level_title
FROM public.exercises e
LEFT JOIN public.chapters c ON e.chapter_id = c.id
LEFT JOIN public.subjects s ON c.subject_id = s.id
LEFT JOIN public.levels l ON s.level_id = l.id
WHERE 
  -- Show all exercises but conditionally show content
  auth.role() = 'authenticated';

-- ========================================
-- 4. GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.get_exercise_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exercise_content(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_exercise_content(UUID) TO authenticated;

-- Grant access to views
GRANT SELECT ON public.exercise_previews TO authenticated;
GRANT SELECT ON public.accessible_exercises TO authenticated;

-- ========================================
-- 5. UPDATE USER_ACCESSIBLE_EXERCISES VIEW
-- ========================================

-- Update the existing view to support freemium model
CREATE OR REPLACE VIEW public.user_accessible_exercises AS
SELECT 
  e.id,
  e.name,
  e.tag,
  e.difficulty,
  e.chapter_id,
  -- Only show file URLs if user has access
  CASE 
    WHEN public.is_admin() OR e.is_public = true OR public.has_active_subscription() 
    THEN e.exercise_file_urls 
    ELSE ARRAY[]::TEXT[] 
  END as exercise_file_urls,
  CASE 
    WHEN public.is_admin() OR e.is_public = true OR public.has_active_subscription() 
    THEN e.correction_file_urls 
    ELSE ARRAY[]::TEXT[] 
  END as correction_file_urls,
  e.created_at,
  e.updated_at,
  e.is_public,
  c.title as chapter_title,
  s.title as subject_title,
  l.title as level_title,
  -- Add access status
  CASE 
    WHEN public.is_admin() THEN 'admin'
    WHEN e.is_public = true THEN 'public'
    WHEN public.has_active_subscription() THEN 'premium'
    ELSE 'locked'
  END as access_status
FROM public.exercises e
LEFT JOIN public.chapters c ON e.chapter_id = c.id
LEFT JOIN public.subjects s ON c.subject_id = s.id
LEFT JOIN public.levels l ON s.level_id = l.id;

-- ========================================
-- 6. EXAMPLE USAGE QUERIES
-- ========================================

-- Example: Get all exercise previews (for exercise listing page)
-- SELECT * FROM public.exercise_previews ORDER BY created_at DESC;

-- Example: Get full content for a specific exercise (will fail if no access)
-- SELECT * FROM public.get_exercise_content('your-exercise-id');

-- Example: Check if user can access specific exercise
-- SELECT public.can_access_exercise_content('your-exercise-id');

COMMIT;

-- Success message
SELECT '✅ Freemium Exercise Access Model Implemented!' as message,
       'Users can now see exercise metadata but need premium for content' as description;

