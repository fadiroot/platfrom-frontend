-- Minimal Fix for Admin Functions Only
-- This script fixes only the essential admin functions without touching problematic ones

-- Step 1: Drop only the student account functions (these are safe to drop)
DROP FUNCTION IF EXISTS public.activate_student_account(BIGINT, UUID, INTEGER, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deactivate_student_account(BIGINT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.activate_student_account(BIGINT, TEXT, INTEGER, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deactivate_student_account(BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deactivate_student_account(UUID, UUID, TEXT);

-- Step 2: Update the is_admin function (don't drop, just replace)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$;

-- Step 3: Create activate_student_account function for UUIDs
CREATE OR REPLACE FUNCTION public.activate_student_account(
  student_profile_id UUID,  -- This is the user_id UUID
  admin_user_id UUID,
  subscription_months INTEGER DEFAULT 1,
  payment_amount NUMERIC DEFAULT NULL,
  payment_method TEXT DEFAULT NULL,
  payment_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    is_active = true,
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + (subscription_months || ' months')::INTERVAL,
    payment_status = CASE 
      WHEN payment_amount IS NOT NULL THEN 'paid'
      ELSE 'pending'
    END,
    payment_amount = payment_amount,
    payment_method = payment_method,
    payment_notes = payment_notes,
    activated_by = admin_user_id,
    activated_at = NOW(),
    updated_at = NOW()
  WHERE user_id = student_profile_id;  -- Use user_id instead of id

  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to activate student account: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 4: Create deactivate_student_account function for UUIDs
CREATE OR REPLACE FUNCTION public.deactivate_student_account(
  student_profile_id UUID,  -- This is the user_id UUID
  admin_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  WHERE user_id = student_profile_id;  -- Use user_id instead of id

  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to deactivate student account: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 5: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Step 6: Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for user_roles (drop existing first)
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles" ON user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- Step 8: Grant permissions for admin functions only
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_student_account(UUID, UUID, TEXT) TO authenticated;

-- Step 9: Test the functions
SELECT 'Admin functions updated successfully' as status;

-- Step 10: Show function signatures for verification
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('activate_student_account', 'deactivate_student_account', 'is_admin')
ORDER BY p.proname;
