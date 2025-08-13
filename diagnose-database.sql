-- Database Diagnostic Script
-- This script shows exactly what's in your database and what needs to be fixed

-- 1. Check what functions currently exist
SELECT '=== EXISTING FUNCTIONS ===' as info;
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('activate_student_account', 'deactivate_student_account', 'is_admin', 'get_user_accessible_exercises', 'can_access_exercise')
ORDER BY p.proname;

-- 2. Check what tables exist
SELECT '=== EXISTING TABLES ===' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('student_profile', 'user_roles', 'users', 'exercises', 'chapters', 'subjects', 'levels')
ORDER BY table_name;

-- 3. Check student_profile table structure
SELECT '=== STUDENT_PROFILE TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'student_profile'
ORDER BY ordinal_position;

-- 4. Check if user_roles table exists and its structure
SELECT '=== USER_ROLES TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 5. Check RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('student_profile', 'user_roles')
ORDER BY tablename, policyname;

-- 6. Check what views depend on is_admin function
SELECT '=== VIEWS USING IS_ADMIN ===' as info;
SELECT 
  v.viewname,
  v.definition
FROM pg_views v
WHERE v.schemaname = 'public'
AND v.definition LIKE '%is_admin%';

-- 7. Check what policies depend on is_admin function
SELECT '=== POLICIES USING IS_ADMIN ===' as info;
SELECT 
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND qual LIKE '%is_admin%';

-- 8. Show current function signatures that are causing issues
SELECT '=== PROBLEMATIC FUNCTION SIGNATURES ===' as info;
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_arguments(p.oid) LIKE '%bigint%' THEN 'NEEDS FIX - has bigint'
    WHEN pg_get_function_arguments(p.oid) LIKE '%uuid%' THEN 'OK - has uuid'
    ELSE 'CHECK - unknown type'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('activate_student_account', 'deactivate_student_account')
ORDER BY p.proname;
