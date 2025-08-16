-- Test Access Control for Inactive Users
-- Run this script to verify premium content protection

-- 1. Check current exercise status
SELECT 
  COUNT(*) as total_exercises,
  COUNT(CASE WHEN is_public = true THEN 1 END) as public_exercises,
  COUNT(CASE WHEN is_public = false THEN 1 END) as private_exercises
FROM exercises;

-- 2. Check if functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('can_access_exercise', 'get_user_accessible_exercises')
ORDER BY routine_name;

-- 3. Test with a specific inactive user (replace with actual user ID)
-- This should return FALSE for private exercises
-- SELECT can_access_exercise('exercise-id-here') as has_access;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'exercises';

-- 5. Show sample exercises with their public status
SELECT 
  id,
  name,
  is_public,
  created_at
FROM exercises 
ORDER BY created_at 
LIMIT 5;
