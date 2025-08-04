-- =============================================
-- Update Auth Users with Level ID
-- Since profiles table was already dropped
-- =============================================

-- First, let's see existing users and their current metadata
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users;

-- Method 1: Update ALL users to have a default level_id
-- Replace 'your-default-level-uuid' with an actual level ID from your levels table
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'level_id', 'your-default-level-uuid'
)
WHERE raw_user_meta_data->>'level_id' IS NULL;

-- Method 2: Update specific users with specific level_id
-- Replace the email and level_id with actual values
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'level_id', 'specific-level-uuid-here'
)
WHERE email = 'user@example.com';

-- Method 3: Update users and add other missing profile data
-- You'll need to replace these with actual values for each user
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'first_name', 'John',
  'last_name', 'Doe',
  'username', 'johndoe',
  'level_id', 'your-level-uuid-here'
)
WHERE email = 'john@example.com';

-- Get your available levels to choose from
SELECT id, title, description FROM public.levels;

-- Verify the updates worked
SELECT 
  id,
  email,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'level_id' as level_id,
  raw_user_meta_data->>'username' as username
FROM auth.users;