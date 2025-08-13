-- Debug Admin Issue
-- This script will help us understand why is_admin() returns false

-- Step 1: Check if user_roles table exists
SELECT '=== CHECKING USER_ROLES TABLE ===' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
) as user_roles_table_exists;

-- Step 2: Check current user
SELECT '=== CURRENT USER ===' as info;
SELECT auth.uid() as current_user_id;

-- Step 3: Check if user_roles table has data
SELECT '=== USER_ROLES DATA ===' as info;
SELECT * FROM user_roles LIMIT 10;

-- Step 4: Check if current user has admin role
SELECT '=== CURRENT USER ADMIN STATUS ===' as info;
SELECT 
  ur.user_id,
  ur.role,
  ur.is_active,
  ur.created_at
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- Step 5: Test is_admin function
SELECT '=== IS_ADMIN FUNCTION TEST ===' as info;
SELECT is_admin() as is_admin_result;

-- Step 6: Check all users with admin roles
SELECT '=== ALL ADMIN USERS ===' as info;
SELECT 
  u.id,
  u.email,
  ur.role,
  ur.is_active,
  ur.created_at as role_created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin')
ORDER BY ur.created_at DESC;

-- Step 7: Show the is_admin function definition
SELECT '=== IS_ADMIN FUNCTION DEFINITION ===' as info;
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'is_admin';
