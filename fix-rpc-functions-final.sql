-- Final Fix for RPC Functions
-- This script safely updates RPC functions handling all dependency and return type issues

-- Step 1: Drop functions that need structural changes
DROP FUNCTION IF EXISTS public.activate_student_account(BIGINT, UUID, INTEGER, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deactivate_student_account(BIGINT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.activate_student_account(BIGINT, TEXT, INTEGER, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deactivate_student_account(BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deactivate_student_account(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_accessible_exercises(UUID);
DROP FUNCTION IF EXISTS public.can_access_exercise(UUID);

-- Step 2: Update the is_admin function (don't drop, just replace)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$;

-- Step 3: Create activate_student_account function for UUIDs
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
    is_active = true,
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + (subscription_months || ' months')::INTERVAL,
    payment_status = CASE 
      WHEN payment_amount IS NOT NULL THEN 'paid'
      ELSE 'pending'
    END,
    payment_amount = payment_amount,
    payment_method = payment_method,
    payment_notes = payment_notes,
    activated_by = admin_user_id,
    activated_at = NOW(),
    updated_at = NOW()
  WHERE user_id = student_profile_id;  -- Use user_id instead of id

  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to activate student account: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 4: Create deactivate_student_account function for UUIDs
CREATE OR REPLACE FUNCTION public.deactivate_student_account(
  student_profile_id UUID,  -- This is the user_id UUID
  admin_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  WHERE user_id = student_profile_id;  -- Use user_id instead of id

  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to deactivate student account: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 5: Create get_user_accessible_exercises function with proper return type
CREATE OR REPLACE FUNCTION public.get_user_accessible_exercises(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  tag INTEGER,
  difficulty VARCHAR,
  chapter_id UUID,
  exercise_file_urls TEXT[],
  correction_file_urls TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_public BOOLEAN,
  chapter_title VARCHAR,
  subject_title VARCHAR,
  subject_id UUID,
  level_title VARCHAR,
  level_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is active and has valid subscription using student_profile
  IF EXISTS (
    SELECT 1 FROM student_profile sp
    WHERE sp.user_id = user_uuid 
    AND sp.is_active = true 
    AND (sp.subscription_end_date IS NULL OR sp.subscription_end_date > NOW())
  ) THEN
    -- Return all exercises for active users
    RETURN QUERY
    SELECT 
      e.id,
      e.name,
      e.tag,
      e.difficulty::VARCHAR,
      e.chapter_id,
      e.exercise_file_urls,
      e.correction_file_urls,
      e.created_at,
      e.updated_at,
      e.is_public,
      c.title as chapter_title,
      s.title as subject_title,
      s.id as subject_id,
      l.title as level_title,
      l.id as level_id
    FROM exercises e
    LEFT JOIN chapters c ON e.chapter_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN levels l ON s.level_id = l.id
    ORDER BY e.created_at DESC;
  ELSE
    -- Return only public exercises for inactive users
    RETURN QUERY
    SELECT 
      e.id,
      e.name,
      e.tag,
      e.difficulty::VARCHAR,
      e.chapter_id,
      e.exercise_file_urls,
      e.correction_file_urls,
      e.created_at,
      e.updated_at,
      e.is_public,
      c.title as chapter_title,
      s.title as subject_title,
      s.id as subject_id,
      l.title as level_title,
      l.id as level_id
    FROM exercises e
    LEFT JOIN chapters c ON e.chapter_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN levels l ON s.level_id = l.id
    WHERE e.is_public = true
    ORDER BY e.created_at DESC;
  END IF;
END;
$$;

-- Step 6: Create can_access_exercise function
CREATE OR REPLACE FUNCTION public.can_access_exercise(exercise_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  is_exercise_public BOOLEAN;
  is_user_active BOOLEAN;
  subscription_valid BOOLEAN;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  -- If no user is logged in, only allow public exercises
  IF user_uuid IS NULL THEN
    SELECT is_public INTO is_exercise_public FROM exercises WHERE id = exercise_id;
    RETURN COALESCE(is_exercise_public, false);
  END IF;
  
  -- Check if exercise is public
  SELECT is_public INTO is_exercise_public FROM exercises WHERE id = exercise_id;
  
  -- If exercise is public, allow access
  IF is_exercise_public = true THEN
    RETURN true;
  END IF;
  
  -- Check user activation status and subscription using student_profile
  SELECT 
    sp.is_active,
    (sp.subscription_end_date IS NULL OR sp.subscription_end_date > NOW())
  INTO is_user_active, subscription_valid
  FROM student_profile sp
  WHERE sp.user_id = user_uuid;
  
  -- Allow access if user is active and has valid subscription
  RETURN COALESCE(is_user_active, false) AND COALESCE(subscription_valid, false);
END;
$$;

-- Step 7: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Step 8: Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for user_roles (drop existing first)
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles" ON user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- Step 10: Grant permissions
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID, UUID, INTEGER, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_student_account(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_accessible_exercises(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_exercise(UUID) TO authenticated;

-- Step 11: Test the functions
SELECT 'RPC Functions updated successfully' as status;

-- Step 12: Show function signatures for verification
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('activate_student_account', 'deactivate_student_account', 'is_admin', 'get_user_accessible_exercises', 'can_access_exercise')
ORDER BY p.proname;
