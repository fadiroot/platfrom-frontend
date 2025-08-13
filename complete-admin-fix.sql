-- Complete Admin Fix
-- This script will fix the is_admin function and add your user as admin

-- Step 1: Update is_admin function to check user_roles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  user_role TEXT;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  -- If no user is logged in, return false
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check user_roles table for admin role
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = user_uuid 
    AND is_active = true;
  
  -- Return true if role is admin or super_admin
  RETURN user_role IN ('admin', 'super_admin');
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return false
    RETURN false;
END;
$$;

-- Step 2: Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Step 3: Add current user as admin
INSERT INTO user_roles (id, user_id, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  auth.uid(),
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW()
WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin';

-- Step 4: Test the fix
SELECT '=== ADMIN FIX COMPLETE ===' as info;

SELECT 'Current user ID:' as field, auth.uid() as value
UNION ALL
SELECT 'User in user_roles table:' as field, 
       CASE WHEN EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid()) 
            THEN 'YES' ELSE 'NO' END as value
UNION ALL
SELECT 'Admin role active:' as field,
       CASE WHEN EXISTS(SELECT 1 FROM user_roles 
                       WHERE user_id = auth.uid() 
                         AND role = 'admin' 
                         AND is_active = true) 
            THEN 'YES' ELSE 'NO' END as value
UNION ALL
SELECT 'is_admin() returns:' as field,
       CASE WHEN is_admin() THEN 'TRUE' ELSE 'FALSE' END as value;

-- Step 5: Show detailed user roles
SELECT '=== USER ROLES DETAIL ===' as info;

SELECT 
  role,
  is_active,
  created_at,
  updated_at
FROM user_roles 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
