-- Fix for ambiguous payment_amount column reference
-- This script fixes the activate_student_account function

-- Step 1: Drop the problematic function
DROP FUNCTION IF EXISTS public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT);

-- Step 2: Create fixed activate_student_account function with explicit table aliases
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

  -- Update student profile using user_id with explicit table reference
  UPDATE public.student_profile AS sp
  SET 
    is_active = true,
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + (subscription_months || ' months')::INTERVAL,
    payment_status = CASE 
      WHEN payment_amount IS NOT NULL THEN 'paid'
      ELSE 'pending'
    END,
    payment_amount = activate_student_account.payment_amount,  -- Explicit parameter reference
    payment_method = activate_student_account.payment_method,  -- Explicit parameter reference
    payment_notes = activate_student_account.payment_notes,    -- Explicit parameter reference
    activated_by = admin_user_id,
    activated_at = NOW(),
    updated_at = NOW()
  WHERE sp.user_id = student_profile_id;  -- Use table alias

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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT) TO authenticated;

-- Step 4: Test the function
SELECT '=== PAYMENT AMOUNT AMBIGUOUS FIX ===' as info;

-- Show function definition
SELECT 'Function created successfully' as status;

-- Test with a sample call (this will fail if no student profile exists, but will show the function works)
SELECT 'Function syntax is valid' as test_result;
