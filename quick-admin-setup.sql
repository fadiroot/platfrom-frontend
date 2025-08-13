-- Quick Admin Setup
-- Run this script to quickly set up admin access

-- Step 1: Show all users so you can find your email
SELECT '=== ALL USERS ===' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Step 2: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Step 3: Enable RLS and create policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read user roles" ON user_roles;
CREATE POLICY "Authenticated users can read user roles" ON user_roles
FOR SELECT USING (auth.role() = 'authenticated');

-- Step 4: Make the most recent user admin (usually the one you just created)
INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users 
WHERE id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ON CONFLICT (user_id, role) DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- Step 5: Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  admin_exists BOOLEAN;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  ) INTO admin_exists;
  
  RETURN COALESCE(admin_exists, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Step 6: Grant permissions
GRANT SELECT ON user_roles TO authenticated;

-- Step 7: Verify setup
SELECT '=== ADMIN SETUP COMPLETE ===' as info;
SELECT 'Admin users:' as check_item;
SELECT 
  u.email,
  ur.role,
  ur.is_active
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin')
ORDER BY ur.created_at DESC;

-- Step 8: Test is_admin function
SELECT 'Is admin function test:' as check_item, is_admin() as result;
