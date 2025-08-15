-- Fix for student profile empty response issue
-- This script diagnoses and fixes the issue where student_profile queries return empty data

BEGIN;

-- ===== STEP 1: DIAGNOSE THE ISSUE =====

-- Check if the specific user exists in auth.users
SELECT 
  'User exists in auth.users' as check_type,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Check if student profile exists for this user
SELECT 
  'Student profile exists' as check_type,
  id,
  user_id,
  level_id,
  is_active,
  created_at
FROM student_profile 
WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Check RLS policies on student_profile table
SELECT 
  'RLS policies' as check_type,
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

-- Check if RLS is enabled on student_profile
SELECT 
  'RLS enabled' as check_type,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'student_profile';

-- ===== STEP 2: FIX RLS POLICIES =====

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can insert own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Users can update own student profile" ON public.student_profile;
DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Admins can update all student profiles" ON public.student_profile;
DROP POLICY IF EXISTS "Admins can insert student profiles" ON public.student_profile;

-- Create simple, direct policies that work for authenticated users
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

-- Create admin policies
CREATE POLICY "Admins can view all student profiles" ON public.student_profile
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "Admins can update all student profiles" ON public.student_profile
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "Admins can insert student profiles" ON public.student_profile
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

-- ===== STEP 3: CREATE MISSING STUDENT PROFILE =====

-- Get available levels to assign a default level
SELECT 
  'Available levels' as check_type,
  id,
  title,
  description
FROM levels 
ORDER BY created_at 
LIMIT 5;

-- Create student profile if it doesn't exist
INSERT INTO student_profile (
  user_id,
  level_id,
  is_active,
  created_at,
  updated_at
)
SELECT 
  'b0d2ff54-52d4-451a-9c71-f98b6457ddf0',
  (SELECT id FROM levels ORDER BY created_at LIMIT 1), -- Use first available level
  false, -- Set to false initially, admin can activate later
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM student_profile WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0'
);

-- ===== STEP 4: VERIFY THE FIX =====

-- Verify the profile was created
SELECT 
  'Profile created' as check_type,
  sp.id,
  sp.user_id,
  sp.level_id,
  sp.is_active,
  l.title as level_title,
  sp.created_at
FROM student_profile sp
LEFT JOIN levels l ON sp.level_id = l.id
WHERE sp.user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Test the exact query that was failing
SELECT 
  'Test query result' as check_type,
  user_id,
  level_id
FROM student_profile 
WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Verify RLS policies are working
SELECT 
  'RLS policies after fix' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'student_profile'
ORDER BY policyname;

COMMIT;
