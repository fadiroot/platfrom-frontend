-- Migration: Comprehensive RLS Security for All Tables
-- This migration implements proper Row Level Security policies for all tables
-- ensuring users can only access data they have the right to access

BEGIN;

-- ========================================
-- 1. CLEAN UP EXISTING POLICIES
-- ========================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.chapters;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.chapters;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.chapters;
DROP POLICY IF EXISTS "Chapters are viewable by authenticated users" ON public.chapters;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.chapters;

DROP POLICY IF EXISTS "Authenticated users can delete exercises" ON public.exercises;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.exercises;
DROP POLICY IF EXISTS "Users can view public exercises" ON public.exercises;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.exercises;
DROP POLICY IF EXISTS "Exercises are viewable by authenticated users" ON public.exercises;
DROP POLICY IF EXISTS "Private exercises for active students" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can read exercises" ON public.exercises;
DROP POLICY IF EXISTS "Public exercises accessible to all" ON public.exercises;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON public.exercises;

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.levels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.levels;
DROP POLICY IF EXISTS "Levels are viewable by authenticated users" ON public.levels;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.levels;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.levels;

DROP POLICY IF EXISTS "Users can insert own profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can view own or admin-managed profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.student_profile;

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Subjects are viewable by authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.subjects;

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles, admins can read all" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;

-- ========================================
-- 2. ENABLE RLS ON ALL TABLES
-- ========================================

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. LEVELS TABLE POLICIES
-- ========================================

-- Admins have full access to levels
CREATE POLICY "Admin full access to levels" ON public.levels
  FOR ALL USING (public.is_admin());

-- All authenticated users can read levels (for course browsing)
CREATE POLICY "Authenticated users can read levels" ON public.levels
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- 4. SUBJECTS TABLE POLICIES
-- ========================================

-- Admins have full access to subjects
CREATE POLICY "Admin full access to subjects" ON public.subjects
  FOR ALL USING (public.is_admin());

-- All authenticated users can read subjects (for course browsing)
CREATE POLICY "Authenticated users can read subjects" ON public.subjects
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- 5. CHAPTERS TABLE POLICIES
-- ========================================

-- Admins have full access to chapters
CREATE POLICY "Admin full access to chapters" ON public.chapters
  FOR ALL USING (public.is_admin());

-- All authenticated users can read chapters (for course browsing)
CREATE POLICY "Authenticated users can read chapters" ON public.chapters
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- 6. EXERCISES TABLE POLICIES
-- ========================================

-- Admins have full access to all exercises
CREATE POLICY "Admin full access to exercises" ON public.exercises
  FOR ALL USING (public.is_admin());

-- Public exercises are accessible to all authenticated users
CREATE POLICY "Public exercises readable by authenticated users" ON public.exercises
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_public = true
  );

-- Private exercises are only accessible to active students
CREATE POLICY "Private exercises for active students only" ON public.exercises
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND is_public = false 
    AND EXISTS (
      SELECT 1 FROM public.student_profile 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND (subscription_end_date IS NULL OR subscription_end_date > NOW())
    )
  );

-- ========================================
-- 7. USER_PROGRESS TABLE POLICIES
-- ========================================

-- Admins have full access to all user progress
CREATE POLICY "Admin full access to user progress" ON public.user_progress
  FOR ALL USING (public.is_admin());

-- Users can only access their own progress
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own progress (optional)
CREATE POLICY "Users can delete own progress" ON public.user_progress
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 8. STUDENT_PROFILE TABLE POLICIES
-- ========================================

-- Admins have full access to all student profiles
CREATE POLICY "Admin full access to student profiles" ON public.student_profile
  FOR ALL USING (public.is_admin());

-- Users can view and update their own profile
CREATE POLICY "Users can view own student profile" ON public.student_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own student profile" ON public.student_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can create their own profile during signup
CREATE POLICY "Users can insert own student profile" ON public.student_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 9. USER_ROLES TABLE POLICIES
-- ========================================

-- Only admins can manage user roles (insert, update, delete)
CREATE POLICY "Admin full access to user roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- 10. SECURITY FUNCTIONS (if needed)
-- ========================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has active subscription in student_profile
  RETURN EXISTS (
    SELECT 1 FROM public.student_profile 
    WHERE user_id = auth.uid() 
    AND is_active = true 
    AND (subscription_end_date IS NULL OR subscription_end_date > NOW())
  );
END;
$$;

-- Function to check if user can access specific exercise
CREATE OR REPLACE FUNCTION public.can_access_exercise(exercise_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_exercise_public BOOLEAN;
BEGIN
  -- If user is admin, grant access
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  
  -- Check if exercise is public
  SELECT is_public INTO is_exercise_public
  FROM public.exercises
  WHERE id = exercise_id;
  
  -- If exercise is public, allow access
  IF is_exercise_public = true THEN
    RETURN true;
  END IF;
  
  -- For private exercises, check if user has active subscription
  RETURN public.has_active_subscription();
END;
$$;

-- ========================================
-- 11. GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.has_active_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_exercise(UUID) TO authenticated;

-- Grant basic table permissions
GRANT SELECT ON public.levels TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.chapters TO authenticated;
GRANT SELECT ON public.exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.student_profile TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Grant admin permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================
-- 12. CREATE HELPFUL VIEWS (OPTIONAL)
-- ========================================

-- View for user's accessible exercises
CREATE OR REPLACE VIEW public.user_accessible_exercises AS
SELECT 
  e.*,
  c.title as chapter_title,
  s.title as subject_title,
  l.title as level_title
FROM public.exercises e
LEFT JOIN public.chapters c ON e.chapter_id = c.id
LEFT JOIN public.subjects s ON c.subject_id = s.id
LEFT JOIN public.levels l ON s.level_id = l.id
WHERE 
  -- Public exercises
  e.is_public = true 
  OR 
  -- Private exercises for active students
  (e.is_public = false AND public.has_active_subscription())
  OR
  -- All exercises for admins
  public.is_admin();

-- Grant access to view
GRANT SELECT ON public.user_accessible_exercises TO authenticated;

-- ========================================
-- 13. VERIFICATION QUERIES
-- ========================================

-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('levels', 'subjects', 'chapters', 'exercises', 'user_progress', 'student_profile', 'user_roles')
ORDER BY tablename;

COMMIT;

-- Display success message
SELECT '✅ Comprehensive RLS Security Applied Successfully!' as message,
       'All tables now have proper Row Level Security policies' as description;

