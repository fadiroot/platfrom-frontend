-- Check exercise public status and access
-- Run this script to diagnose the access issue

-- 1. Check if the exercise exists and its public status
SELECT 
  id,
  name,
  is_public,
  created_at
FROM exercises 
WHERE id = '79d2862a-2e4e-45de-9675-737fd9ac921d';

-- 2. Check if the user exists and their profile
SELECT 
  u.id,
  u.email,
  sp.is_active,
  sp.subscription_end_date,
  sp.created_at
FROM auth.users u
LEFT JOIN student_profile sp ON u.id = sp.user_id
WHERE u.id = '1d106cd0-c73d-463a-9fea-c9a19676112e';

-- 3. Test the can_access_exercise function directly
-- Note: This needs to be run as the authenticated user
-- You can test this in the Supabase dashboard SQL editor while logged in as the user

-- 4. Check if the can_access_exercise function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'can_access_exercise';

-- 5. Check RLS policies on exercises table
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
WHERE tablename = 'exercises';

-- 6. Check if student_profile table exists and has data
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_profiles,
  COUNT(CASE WHEN subscription_end_date > NOW() OR subscription_end_date IS NULL THEN 1 END) as valid_subscriptions
FROM student_profile;
