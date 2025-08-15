-- Fix student_profile RLS policy issue
-- Run this script in your Supabase SQL editor to fix the 42501 error

-- Add the missing RLS policy that allows users to insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own student profile" ON student_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created
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
AND policyname = 'Users can insert own student profile';
