-- Undo RLS Policies for Astuce Platform
-- This script reverts all RLS policies and restores the original state

BEGIN;

-- =====================================================
-- 1. DROP ALL RLS POLICIES
-- =====================================================

-- Drop student_profile policies
DROP POLICY IF EXISTS "Users can view own student profile" ON student_profile;
DROP POLICY IF EXISTS "Users can update own student profile" ON student_profile;
DROP POLICY IF EXISTS "Admins can view all student profiles" ON student_profile;
DROP POLICY IF EXISTS "Admins can update all student profiles" ON student_profile;
DROP POLICY IF EXISTS "Admins can insert student profiles" ON student_profile;

-- Drop user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON user_roles;

-- Drop levels policies
DROP POLICY IF EXISTS "Everyone can view levels" ON levels;
DROP POLICY IF EXISTS "Admins can manage levels" ON levels;

-- Drop subjects policies
DROP POLICY IF EXISTS "Users can view subjects for their level" ON subjects;
DROP POLICY IF EXISTS "Admins can view all subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

-- Drop chapters policies
DROP POLICY IF EXISTS "Users can view chapters for their level" ON chapters;
DROP POLICY IF EXISTS "Admins can manage chapters" ON chapters;

-- Drop exercises policies
DROP POLICY IF EXISTS "Users can view exercises based on access" ON exercises;
DROP POLICY IF EXISTS "Admins can manage exercises" ON exercises;

-- Drop user_activation_history policies
DROP POLICY IF EXISTS "Users can view own activation history" ON user_activation_history;
DROP POLICY IF EXISTS "Admins can view all activation history" ON user_activation_history;
DROP POLICY IF EXISTS "Admins can insert activation history" ON user_activation_history;

-- Drop user_progress policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_progress') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own progress" ON user_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own progress" ON user_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all progress" ON user_progress';
  END IF;
END $$;

-- =====================================================
-- 2. DISABLE RLS ON TABLES
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE student_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activation_history DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_progress if exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_progress') THEN
    EXECUTE 'ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- =====================================================
-- 3. DROP HELPER FUNCTIONS
-- =====================================================

-- Drop helper functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS get_user_level_id();
DROP FUNCTION IF EXISTS is_active_student();

-- =====================================================
-- 4. DROP SECURITY VIEWS
-- =====================================================

-- Drop the student dashboard view
DROP VIEW IF EXISTS student_dashboard_view;

-- =====================================================
-- 5. RESTORE ORIGINAL PERMISSIONS
-- =====================================================

-- Grant full permissions to authenticated users (restore original state)
GRANT ALL ON student_profile TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON levels TO authenticated;
GRANT ALL ON subjects TO authenticated;
GRANT ALL ON chapters TO authenticated;
GRANT ALL ON exercises TO authenticated;
GRANT ALL ON user_activation_history TO authenticated;

-- Grant permissions for user_progress if exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_progress') THEN
    EXECUTE 'GRANT ALL ON user_progress TO authenticated';
  END IF;
END $$;

-- Grant permissions for views
GRANT ALL ON user_status_view TO authenticated;

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION get_user_accessible_exercises(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_exercise(UUID) TO authenticated;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check RLS status on all tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  RAISE NOTICE 'Verifying RLS status on tables:';
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('student_profile', 'user_roles', 'levels', 'subjects', 'chapters', 'exercises', 'user_activation_history')
  LOOP
    EXECUTE format('SELECT row_security FROM information_schema.tables WHERE table_name = %L AND table_schema = ''public''', table_record.table_name);
  END LOOP;
END $$;

COMMIT;

-- =====================================================
-- SUMMARY OF CHANGES REVERTED
-- =====================================================

/*
UNDO SUMMARY:

✅ REMOVED:
- All RLS policies from all tables
- RLS enabled status from all tables
- Helper functions (is_admin, is_super_admin, get_user_level_id, is_active_student)
- Security views (student_dashboard_view)

✅ RESTORED:
- Full permissions for authenticated users on all tables
- Original access patterns (no restrictions)
- All users can access all data

⚠️  WARNING:
- After running this script, there will be NO security restrictions
- All authenticated users will have full access to all data
- This is equivalent to having no RLS at all

🔧 TO RE-ENABLE RLS:
- Run the comprehensive-rls-setup.sql script again
- Or manually create specific policies as needed
*/













