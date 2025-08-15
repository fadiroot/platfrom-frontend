-- Test Authentication State
-- Run this to check if the current user is properly authenticated

-- Check current authentication state
SELECT 
  'Current Auth State' as info,
  auth.uid() as user_id,
  auth.role() as role,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'Authenticated'
    ELSE 'Not Authenticated'
  END as status;

-- Check if the specific user exists
SELECT 
  'User Check' as info,
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN raw_user_meta_data IS NOT NULL THEN 'Has metadata'
    ELSE 'No metadata'
  END as metadata_status
FROM auth.users 
WHERE id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Check if user has any student profile
SELECT 
  'Profile Check' as info,
  id,
  user_id,
  is_active,
  created_at
FROM student_profile 
WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0';

-- Test RLS policies
SELECT 
  'RLS Test' as info,
  'Testing SELECT access' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM student_profile 
      WHERE user_id = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0'
    ) THEN 'SELECT: OK'
    ELSE 'SELECT: FAILED'
  END as result;
