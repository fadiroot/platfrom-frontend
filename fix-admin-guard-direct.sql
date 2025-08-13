-- Fix Admin Guard - Direct User Metadata Check
-- This script fixes the admin check to use user metadata instead of user_roles table

-- Step 1: Update the is_admin function to check user metadata directly
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
  
  -- Get user role from user metadata
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Return true if role is admin or super_admin
  RETURN user_role IN ('admin', 'super_admin');
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return false
    RETURN false;
END;
$$;

-- Step 2: Alternative function that checks both user_roles table and user metadata
CREATE OR REPLACE FUNCTION public.is_admin_comprehensive()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  user_role TEXT;
  has_role_in_table BOOLEAN;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  -- If no user is logged in, return false
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check user metadata first
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users
  WHERE id = user_uuid;
  
  -- If user has admin role in metadata, return true
  IF user_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;
  
  -- Check user_roles table as fallback
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  ) INTO has_role_in_table;
  
  RETURN COALESCE(has_role_in_table, false);
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return false
    RETURN false;
END;
$$;

-- Step 3: Test the functions
SELECT '=== TESTING ADMIN FUNCTIONS ===' as info;

-- Test current user
SELECT 'Current user ID:' as test_item, auth.uid() as result;

-- Test user metadata
SELECT 'User role from metadata:' as test_item, 
       (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) as result;

-- Test is_admin function
SELECT 'is_admin() result:' as test_item, is_admin() as result;

-- Test comprehensive function
SELECT 'is_admin_comprehensive() result:' as test_item, is_admin_comprehensive() as result;

-- Step 4: Show user details
SELECT '=== USER DETAILS ===' as info;
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_from_metadata,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users 
WHERE id = auth.uid();

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_comprehensive() TO authenticated;
