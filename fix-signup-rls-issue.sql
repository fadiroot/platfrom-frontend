-- Fix RLS Policy Issue for Student Profile Creation During Signup
-- This script specifically addresses the 42501 error during user registration

BEGIN;

-- The issue is that during signup, the user might not be fully authenticated
-- or there's a timing issue with the authentication context.
-- We need to ensure the RLS policies allow users to create their own profiles.

-- First, let's check current policies
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

-- Drop any complex policies that might be interfering
DROP POLICY IF EXISTS "Users can view own or admin-managed profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.student_profile;

-- Create simple, direct policies that work during signup
-- These policies are more permissive and should work even during the signup process
CREATE POLICY "Users can view own student profile" ON public.student_profile
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own student profile" ON public.student_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own student profile" ON public.student_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.student_profile ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON student_profile TO authenticated;

-- Verify the policies were created correctly
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

-- Test the policies by checking if the specific user can now create a profile
-- (This will be run by the application, not here)

COMMIT;
