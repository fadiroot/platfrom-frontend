-- Complete Fix for Admin Issue
-- This script will fix the admin authentication problem

-- Step 1: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Step 2: Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for user_roles
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

-- Step 4: Create a policy that allows all authenticated users to read user_roles
-- This is needed for the is_admin function to work
DROP POLICY IF EXISTS "Authenticated users can read user roles" ON user_roles;
CREATE POLICY "Authenticated users can read user roles" ON user_roles
FOR SELECT USING (auth.role() = 'authenticated');

-- Step 5: Update the is_admin function to be more robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  
  -- If no user is logged in, return false
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role in user_roles table
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  ) INTO admin_exists;
  
  RETURN COALESCE(admin_exists, false);
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error (like table doesn't exist), return false
    RETURN false;
END;
$$;

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_roles TO authenticated;

-- Step 7: Find your user ID (you'll need to replace YOUR_EMAIL with your actual email)
SELECT '=== YOUR USER ID ===' as info;
SELECT id, email, created_at FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

-- Step 8: Make yourself admin (replace YOUR_USER_ID_HERE with your actual UUID)
-- Example: INSERT INTO user_roles (user_id, role) VALUES ('12345678-1234-1234-1234-123456789abc', 'admin');
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin')  -- Replace with your actual user ID
ON CONFLICT (user_id, role) DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- Step 9: Verify the fix
SELECT '=== VERIFICATION ===' as info;

-- Check if user_roles table exists
SELECT 'User roles table exists:' as check_item, 
       EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') as result;

-- Check current user
SELECT 'Current user ID:' as check_item, auth.uid() as result;

-- Check admin users
SELECT 'Admin users count:' as check_item, COUNT(*) as result
FROM user_roles 
WHERE role IN ('admin', 'super_admin') AND is_active = true;

-- Test is_admin function
SELECT 'Is admin function result:' as check_item, is_admin() as result;

-- Show all admin users
SELECT 'All admin users:' as check_item;
SELECT 
  u.email,
  ur.role,
  ur.is_active,
  ur.created_at as role_created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin')
ORDER BY ur.created_at DESC;
