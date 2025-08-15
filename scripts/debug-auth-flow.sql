-- Debug Authentication Flow
-- Run this script to check the current authentication state and identify issues

-- 1. Check current authentication state
SELECT 
  '=== AUTHENTICATION STATE ===' as section,
  auth.uid() as current_user_id,
  auth.role() as current_role,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Authenticated'
    ELSE '❌ Not Authenticated'
  END as status;

-- 2. Check if the specific user exists in auth.users
SELECT 
  '=== USER EXISTS CHECK ===' as section,
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN raw_user_meta_data IS NOT NULL THEN '✅ Has metadata'
    ELSE '❌ No metadata'
  END as metadata_status,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmed'
    ELSE '❌ Email not confirmed'
  END as email_status
FROM auth.users 
WHERE id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- 3. Check student profile
SELECT 
  '=== STUDENT PROFILE CHECK ===' as section,
  id,
  user_id,
  is_active,
  created_at,
  CASE 
    WHEN level_id IS NOT NULL THEN '✅ Has level'
    ELSE '❌ No level'
  END as level_status
FROM student_profile 
WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- 4. Test RLS policies
SELECT 
  '=== RLS POLICY TEST ===' as section,
  'Testing SELECT access' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM student_profile 
      WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0'
    ) THEN '✅ SELECT: OK'
    ELSE '❌ SELECT: FAILED'
  END as select_result;

-- 5. Test INSERT access (simulate profile creation)
SELECT 
  '=== INSERT POLICY TEST ===' as section,
  'Testing INSERT access' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM student_profile 
      WHERE user_id = auth.uid()
    ) THEN '✅ User already has profile'
    ELSE '❌ User needs profile creation'
  END as insert_status;

-- 6. Check user roles (for admin access)
SELECT 
  '=== USER ROLES CHECK ===' as section,
  user_id,
  role,
  is_active,
  created_at
FROM user_roles 
WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- 7. Test the can_manage_student_profile function
SELECT 
  '=== FUNCTION TEST ===' as section,
  'Testing can_manage_student_profile function' as test_type,
  CASE 
    WHEN public.can_manage_student_profile('b0d2ff54-52d4-451a-9c71-f98b6457ddf0') THEN '✅ Function returns true'
    ELSE '❌ Function returns false'
  END as function_result;

-- 8. Check if user is admin
SELECT 
  '=== ADMIN CHECK ===' as section,
  'Testing is_admin function' as test_type,
  CASE 
    WHEN public.is_admin() THEN '✅ User is admin'
    ELSE '❌ User is not admin'
  END as admin_status;
