-- Fix Access Control System
-- This migration ensures proper premium content protection

BEGIN;

-- Step 1: Ensure the can_access_exercise function is properly defined
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

-- Step 2: Ensure the get_user_accessible_exercises function is properly defined
CREATE OR REPLACE FUNCTION public.get_user_accessible_exercises(user_uuid UUID DEFAULT auth.uid())
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

-- Step 3: Update RLS policies for exercises table
DROP POLICY IF EXISTS "Users can view accessible exercises" ON exercises;
CREATE POLICY "Users can view accessible exercises" ON exercises
FOR SELECT USING (
  is_public = true OR
  EXISTS (
    SELECT 1 FROM student_profile sp
    WHERE sp.user_id = auth.uid() 
    AND sp.is_active = true 
    AND (sp.subscription_end_date IS NULL OR sp.subscription_end_date > NOW())
  )
);

-- Step 4: Ensure RLS is enabled on exercises table
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.can_access_exercise(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_accessible_exercises(UUID) TO authenticated;

-- Step 6: Mark ALL exercises as private for testing
-- Update exercises to be private by default (no exceptions)
UPDATE exercises 
SET is_public = false;

-- Step 7: Verify the functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('can_access_exercise', 'get_user_accessible_exercises')
ORDER BY routine_name;

-- Step 8: Test the access control
-- This will show the current status of exercises and access control
SELECT 
  COUNT(*) as total_exercises,
  COUNT(CASE WHEN is_public = true THEN 1 END) as public_exercises,
  COUNT(CASE WHEN is_public = false THEN 1 END) as private_exercises
FROM exercises;

COMMIT;
