-- Complete fix for activate_student_account function
-- This script fixes both the ambiguous column reference and ensures all required columns exist

-- Step 1: First, let's ensure the student_profile table has all required columns
DO $$
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_profile' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE student_profile ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  -- Add any other missing columns that might be needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_profile' 
    AND column_name = 'activated_by'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE student_profile ADD COLUMN activated_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_profile' 
    AND column_name = 'activated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE student_profile ADD COLUMN activated_at TIMESTAMP;
  END IF;
END $$;

-- Step 2: Drop the problematic function
DROP FUNCTION IF EXISTS public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT);

-- Step 3: Create fixed activate_student_account function with explicit parameter references
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
      WHEN activate_student_account.payment_amount IS NOT NULL THEN 'paid'
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT) TO authenticated;

-- Step 5: Verify the function was created successfully
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'activate_student_account';

-- Step 6: Show function permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'activate_student_account';

-- Step 7: Verify student_profile table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_profile' 
AND table_schema = 'public'
ORDER BY ordinal_position;
