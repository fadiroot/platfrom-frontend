-- =============================================
-- Backup Profile Data to Auth Metadata
-- Run this BEFORE dropping the profiles table
-- =============================================

-- This will update auth.users with profile data from profiles table
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'first_name', profiles.first_name,
  'last_name', profiles.last_name,
  'username', profiles.username,
  'phone', profiles.phone,
  'age', profiles.age,
  'birth_date', profiles.birth_date::text,
  'level_id', profiles.level_id::text
)
FROM public.profiles 
WHERE auth.users.id = profiles.id
AND profiles.first_name IS NOT NULL;

-- Verify the backup worked
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  u.raw_user_meta_data->>'level_id' as level_id
FROM auth.users u
WHERE u.raw_user_meta_data->>'first_name' IS NOT NULL;