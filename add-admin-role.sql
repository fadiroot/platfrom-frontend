-- Add Admin Role for Current User
-- This script will add the current user as an admin in the user_roles table

-- Step 1: Get current user ID
SELECT 'Current user ID:' as info, auth.uid() as user_id;

-- Step 2: Check if user already has a role
SELECT 'Existing roles for current user:' as info,
       (SELECT json_agg(json_build_object('role', role, 'is_active', is_active, 'created_at', created_at)) 
        FROM user_roles WHERE user_id = auth.uid()) as existing_roles;

-- Step 3: Insert admin role for current user
INSERT INTO user_roles (id, user_id, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(), -- Generate new UUID for id
  auth.uid(), -- Current user ID
  'admin', -- Role
  true, -- is_active
  NOW(), -- created_at
  NOW() -- updated_at
)
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW()
WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin';

-- Step 4: Verify the insertion
SELECT '=== VERIFICATION ===' as info;

SELECT 'User roles after insertion:' as check_item,
       (SELECT json_agg(json_build_object('role', role, 'is_active', is_active, 'created_at', created_at)) 
        FROM user_roles WHERE user_id = auth.uid()) as roles;

-- Step 5: Test is_admin function
SELECT 'is_admin() result:' as test_item, is_admin() as result;

-- Step 6: Show final status
SELECT '=== FINAL STATUS ===' as info;

SELECT 
  'User ID' as field,
  auth.uid() as value
UNION ALL
SELECT 
  'Has admin role' as field,
  CASE WHEN is_admin() THEN 'YES' ELSE 'NO' END as value
UNION ALL
SELECT 
  'Role in user_roles' as field,
  (SELECT role FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true) as value;
