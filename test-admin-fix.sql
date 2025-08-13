-- Test Admin Fix
-- Run this to test if the admin function works with your user

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

-- Step 2: Test the function
SELECT '=== TESTING ADMIN FUNCTION ===' as info;

-- Show current user
SELECT 'Current user ID:' as test_item, auth.uid() as result;

-- Show user roles from user_roles table
SELECT 'User roles from user_roles table:' as test_item, 
       (SELECT json_agg(json_build_object('role', role, 'is_active', is_active)) 
        FROM user_roles WHERE user_id = auth.uid()) as result;

-- Show user metadata
SELECT 'User metadata:' as test_item, 
       (SELECT raw_user_meta_data FROM auth.users WHERE id = auth.uid()) as result;

-- Test is_admin function
SELECT 'is_admin() result:' as test_item, is_admin() as result;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Step 4: Check if user exists in user_roles table
SELECT '=== CHECKING USER ROLES ===' as info;

SELECT 'User ID in user_roles:' as check_item,
       EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid()) as exists_in_table;

SELECT 'Active admin roles for current user:' as check_item,
       (SELECT COUNT(*) FROM user_roles 
        WHERE user_id = auth.uid() 
          AND role IN ('admin', 'super_admin') 
          AND is_active = true) as admin_count;
