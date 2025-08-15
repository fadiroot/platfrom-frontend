# 🔧 Fix Signup RLS Policy Issue (42501 Error)

## 🚨 Problem Description

You're experiencing a **Row-Level Security (RLS) policy violation** during user signup:

```
Error Code: 42501
Message: "new row violates row-level security policy for table 'student_profile'"
```

This happens when a user tries to register and the system attempts to create a student profile, but the RLS policies prevent the insertion.

## 🎯 Root Cause

The issue occurs because:

1. **Complex RLS Policies**: The existing RLS policies are too restrictive and don't properly handle the signup process
2. **Timing Issues**: During signup, the user authentication context might not be fully established when the profile creation is attempted
3. **Missing Insert Policy**: The RLS policies might be missing or incorrectly configured for user self-insertion

## 🚀 Solution

### Step 1: Run the Comprehensive Fix

1. **Open Supabase Dashboard** → Go to SQL Editor
2. **Copy and paste** the entire content from `comprehensive-signup-fix.sql`
3. **Click "Run"** to execute the fix

**What this does:**
- ✅ Fixes RLS policies to allow users to create their own profiles
- ✅ Recreates the trigger function with better error handling
- ✅ Creates the missing student profile for the specific user
- ✅ Ensures proper permissions are granted

### Step 2: Verify the Fix

1. **Run the test script** `test-signup-fix.sql` to verify everything is working
2. **Test user registration** in your application
3. **Check that student profiles are created** automatically

## 📋 What Was Fixed

### 1. RLS Policies
```sql
-- Simple, direct policies that work during signup
CREATE POLICY "Users can insert own student profile" ON public.student_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 2. Trigger Function
```sql
-- More robust trigger function with better error handling
CREATE OR REPLACE FUNCTION create_student_profile_on_signup()
RETURNS TRIGGER AS $$
-- Handles level_id extraction and profile creation
-- Includes proper error handling
```

### 3. Permissions
```sql
-- Ensure proper permissions are granted
GRANT SELECT, INSERT, UPDATE ON student_profile TO authenticated;
```

## 🔍 Verification Steps

### Check RLS Policies
```sql
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
```

### Check Student Profile
```sql
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
```

### Check Trigger Function
```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_student_profile_on_signup';
```

## 🛡️ Security Notes

- **RLS is still enabled** for data protection
- **Users can only access their own profiles** (except admins)
- **Admin policies remain intact** for management functions
- **Trigger function uses SECURITY DEFINER** for elevated privileges during signup

## 🚨 Alternative Solutions

If the main fix doesn't work, try these alternatives:

### Option 1: Simple RLS Fix
Run `fix-signup-rls-issue.sql` for a minimal fix

### Option 2: Manual Profile Creation
Run `fix-missing-student-profile.sql` to manually create the profile

### Option 3: Disable RLS Temporarily
```sql
-- Only for debugging - NOT recommended for production
ALTER TABLE public.student_profile DISABLE ROW LEVEL SECURITY;
```

## 📞 Next Steps

1. **Run the comprehensive fix**
2. **Test user registration**
3. **Monitor for any remaining issues**
4. **Contact support if problems persist**

The fix should resolve the 42501 error and allow smooth user registration with automatic student profile creation.
