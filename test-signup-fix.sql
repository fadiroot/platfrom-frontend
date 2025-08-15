-- Test Script for Signup Fix
-- This script tests whether the RLS policies and trigger function work correctly

BEGIN;

-- ===== TEST 1: Check if the specific user profile exists =====
SELECT 'TEST 1: Checking if user profile exists' as test_name;

SELECT 
  sp.id,
  sp.user_id,
  sp.level_id,
  sp.is_active,
  l.title as level_title,
  sp.created_at
FROM student_profile sp
LEFT JOIN levels l ON sp.level_id = l.id
WHERE sp.user_id = '302a0a4b-7031-46f4-b5b3-54df533bf49d';

-- ===== TEST 2: Check RLS policies =====
SELECT 'TEST 2: Checking RLS policies' as test_name;

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
WHERE tablename = 'student_profile'
ORDER BY policyname;

-- ===== TEST 3: Check trigger function =====
SELECT 'TEST 3: Checking trigger function' as test_name;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_student_profile_on_signup';

-- ===== TEST 4: Check trigger exists =====
SELECT 'TEST 4: Checking trigger exists' as test_name;

SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- ===== TEST 5: Check table permissions =====
SELECT 'TEST 5: Checking table permissions' as test_name;

SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'student_profile' 
AND grantee = 'authenticated';

-- ===== TEST 6: Simulate signup process (if user doesn't exist) =====
SELECT 'TEST 6: Testing signup simulation' as test_name;

-- Check if the user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = '302a0a4b-7031-46f4-b5b3-54df533bf49d';

-- ===== TEST 7: Check levels table =====
SELECT 'TEST 7: Checking levels table' as test_name;

SELECT 
  id,
  title,
  description
FROM levels 
WHERE id = 'a29bfef6-5b8b-42fd-932b-059438ca7d4d';

COMMIT;
