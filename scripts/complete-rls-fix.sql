-- Complete Student Profile RLS Policy Fix
-- This script provides a comprehensive solution for student_profile permissions

-- First, create the is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  );
END;
$$;

-- Create the comprehensive student profile management function
CREATE OR REPLACE FUNCTION public.can_manage_student_profile(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is the profile owner
  IF check_user_id = auth.uid() THEN
    RETURN true;
  END IF;
  
  -- Check if current user is an admin
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  
  -- Additional checks can be added here
  RETURN false;
END;
$$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can view own or admin-managed profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Admins can update all student profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Admins can insert student profiles" ON public.student_profile;

-- Create new comprehensive policies
CREATE POLICY "Users can view own or admin-managed profiles" ON public.student_profile
FOR SELECT
TO authenticated
USING (
  can_manage_student_profile(user_id)
);

CREATE POLICY "Users can insert own profiles" ON public.student_profile
FOR INSERT
TO authenticated
WITH CHECK (
  can_manage_student_profile(user_id)
);

CREATE POLICY "Users can update own profiles" ON public.student_profile
FOR UPDATE
TO authenticated
USING (
  can_manage_student_profile(user_id)
);

-- Ensure RLS is enabled
ALTER TABLE public.student_profile ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_student_profile(UUID) TO authenticated;

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'student_profile'
ORDER BY policyname;

-- Test the functions (optional - remove in production)
-- SELECT public.is_admin();
-- SELECT public.can_manage_student_profile(auth.uid());
