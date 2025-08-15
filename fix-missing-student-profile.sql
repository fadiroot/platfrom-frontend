-- Fix missing student profile for user experiencing PGRST116 error
-- This script creates a student profile for the user if it doesn't exist
-- AND fixes the RLS policies that are causing the 42501 error

BEGIN;

-- First, let's check if the user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = '302a0a4b-7031-46f4-b5b3-54df533bf49d';

-- Check if student profile already exists
SELECT 
  id,
  user_id,
  level_id,
  is_active,
  created_at
FROM student_profile 
WHERE user_id = '302a0a4b-7031-46f4-b5b3-54df533bf49d';

-- Get available levels to assign a default level
SELECT 
  id,
  title,
  description
FROM levels 
ORDER BY created_at 
LIMIT 5;

-- ===== FIX RLS POLICIES =====
-- The main issue is that the RLS policies are too restrictive for signup
-- We need to ensure users can insert their own profiles during signup

-- Drop existing complex policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own or admin-managed profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Users can view own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own student profile" ON public.student_profile;

-- Create simple, direct policies that work during signup
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

-- Keep admin policies
CREATE POLICY IF NOT EXISTS "Admins can view all student profiles" ON public.student_profile
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "Admins can update all student profiles" ON public.student_profile
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "Admins can insert student profiles" ON public.student_profile
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.student_profile ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON student_profile TO authenticated;

-- ===== CREATE STUDENT PROFILE =====
-- Create student profile if it doesn't exist
-- Replace 'YOUR_DEFAULT_LEVEL_ID' with an actual level ID from the query above
INSERT INTO student_profile (
  user_id,
  level_id,
  is_active,
  created_at,
  updated_at
)
SELECT 
  '302a0a4b-7031-46f4-b5b3-54df533bf49d',
  'a29bfef6-5b8b-42fd-932b-059438ca7d4d', -- Use the level_id from the error
  false, -- Set to false initially, admin can activate later
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM student_profile WHERE user_id = '302a0a4b-7031-46f4-b5b3-54df533bf49d'
);

-- Verify the profile was created
SELECT 
  sp.id,
  sp.user_id,
  sp.level_id,
  sp.is_active,
  l.title as level_title,
  sp.created_at
FROM student_profile sp
LEFT JOIN levels l ON sp.level_id = l.id
WHERE sp.user_id = '302a0a4b-7031-46f4-b5b3-54df533bf49d';

-- Verify RLS policies are working
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

COMMIT;
