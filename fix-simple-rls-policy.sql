-- Simple RLS Policy Fix for student_profile table
-- This script provides a straightforward solution that should resolve authentication issues

BEGIN;

-- Drop existing complex policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own or admin-managed profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.student_profile;

-- Create simple, direct policies
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

COMMIT;

