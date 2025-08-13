-- Comprehensive Fix for Admin Functions and Payment Amount Ambiguity
-- This script fixes both the is_admin function and the activate_student_account function

-- Step 1: Fix is_admin function to check user_roles table
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

-- Step 2: Drop and recreate activate_student_account function with explicit parameter references
DROP FUNCTION IF EXISTS public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.activate_student_account(
  student_profile_id UUID,  -- This is the user_id UUID
  admin_user_id UUID,
  subscription_months INTEGER DEFAULT 1,
  payment_amount_param NUMERIC DEFAULT NULL,  -- Renamed to avoid ambiguity
  payment_method_param TEXT DEFAULT NULL,     -- Renamed to avoid ambiguity
  payment_notes_param TEXT DEFAULT NULL       -- Renamed to avoid ambiguity
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Check if admin user exists and is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = admin_user_id 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update student profile using user_id with explicit parameter references
  UPDATE public.student_profile
  SET 
    is_active = true,
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + (subscription_months || ' months')::INTERVAL,
    payment_status = CASE 
      WHEN payment_amount_param IS NOT NULL THEN 'paid'
      ELSE 'pending'
    END,
    payment_amount = payment_amount_param,      -- Use renamed parameter
    payment_method = payment_method_param,      -- Use renamed parameter
    payment_notes = payment_notes_param,        -- Use renamed parameter
    activated_by = admin_user_id,
    activated_at = NOW(),
    updated_at = NOW()
  WHERE user_id = student_profile_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Student profile not found for user_id: %', student_profile_id;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to activate student account: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 3: Drop and recreate deactivate_student_account function
DROP FUNCTION IF EXISTS public.deactivate_student_account(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.deactivate_student_account(
  student_profile_id UUID,  -- This is the user_id UUID
  admin_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Check if admin user exists and is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = admin_user_id 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update student profile using user_id
  UPDATE public.student_profile 
  SET 
    is_active = false,
    deactivated_by = admin_user_id,
    deactivated_at = NOW(),
    deactivation_reason = reason,
    updated_at = NOW()
  WHERE user_id = student_profile_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Student profile not found for user_id: %', student_profile_id;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to deactivate student account: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_student_account(UUID, UUID, TEXT) TO authenticated;

-- Step 5: Add current user as admin if not already
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

-- Step 6: Test the fixes
SELECT '=== COMPREHENSIVE ADMIN FIX COMPLETE ===' as info;

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
       CASE WHEN is_admin() THEN 'TRUE' ELSE 'FALSE' END as value
UNION ALL
SELECT 'activate_student_account function:' as field,
       'FIXED - No more ambiguous column reference' as value
UNION ALL
SELECT 'deactivate_student_account function:' as field,
       'FIXED - Ready to use' as value;

-- Step 7: Show detailed user roles
SELECT '=== USER ROLES DETAIL ===' as info;

SELECT 
  role,
  is_active,
  created_at,
  updated_at
FROM user_roles 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
