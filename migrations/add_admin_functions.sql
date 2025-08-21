-- Migration: Add Admin Functions
-- This migration adds the required admin functions for student account management

BEGIN;

-- Function: Check if current user is admin (updated version with better error handling)
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

-- Function: Activate student account
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

-- Function: Deactivate student account
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

-- Function: Get student profiles (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_student_profiles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  level_id UUID,
  is_active BOOLEAN,
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  payment_status VARCHAR,
  payment_amount NUMERIC,
  payment_method TEXT,
  payment_notes TEXT,
  activated_by UUID,
  activated_at TIMESTAMP,
  deactivated_by UUID,
  deactivated_at TIMESTAMP,
  deactivation_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return all student profiles for admin users
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    sp.level_id,
    sp.is_active,
    sp.subscription_start_date,
    sp.subscription_end_date,
    sp.payment_status,
    sp.payment_amount,
    sp.payment_method,
    sp.payment_notes,
    sp.activated_by,
    sp.activated_at,
    sp.deactivated_by,
    sp.deactivated_at,
    sp.deactivation_reason,
    sp.created_at,
    sp.updated_at
  FROM public.student_profile sp
  ORDER BY sp.created_at DESC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_student_account(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_profiles() TO authenticated;

COMMIT;
