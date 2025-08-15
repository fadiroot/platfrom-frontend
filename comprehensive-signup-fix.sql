-- Comprehensive Fix for Student Profile Creation During Signup
-- This script fixes the 42501 RLS policy violation error during user registration

BEGIN;

-- ===== STEP 1: FIX RLS POLICIES =====
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

-- ===== STEP 2: FIX TRIGGER FUNCTION =====
-- The trigger function needs to be more robust and handle RLS properly

-- Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION create_student_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  level_id_uuid UUID;
BEGIN
  -- Extract level_id from user metadata if available
  IF NEW.raw_user_meta_data->>'levelId' IS NOT NULL THEN
    level_id_uuid := (NEW.raw_user_meta_data->>'levelId')::UUID;
  ELSE
    level_id_uuid := NULL;
  END IF;
  
  -- Insert student profile with proper error handling
  INSERT INTO student_profile (user_id, level_id, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    level_id_uuid,
    false, -- Set to false initially, admin can activate later
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create student profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_student_profile_on_signup();

-- ===== STEP 3: ENSURE PROPER PERMISSIONS =====
-- Ensure RLS is enabled
ALTER TABLE public.student_profile ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON student_profile TO authenticated;

-- ===== STEP 4: CREATE MISSING STUDENT PROFILE =====
-- Create student profile for the specific user mentioned in the error
INSERT INTO student_profile (
  user_id,
  level_id,
  is_active,
  created_at,
  updated_at
)
SELECT 
  '302a0a4b-7031-46f4-b5b3-54df533bf49d',
  'a29bfef6-5b8b-42fd-932b-059438ca7d4d',
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM student_profile WHERE user_id = '302a0a4b-7031-46f4-b5b3-54df533bf49d'
);

-- ===== STEP 5: VERIFICATION =====
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

-- Verify trigger function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_student_profile_on_signup';

COMMIT;
