# 🔧 Fix Database Functions and Student Profile Issues

## 🚨 Problem Description

Your application is encountering two critical database issues:

1. **Missing Database Functions**: `public.get_user_accessible_exercises(user_uuid)` not found in schema cache
2. **Missing Table Relationship**: Could not find relationship between 'profiles' and 'level_id' tables

## 🎯 Root Cause

The application code is trying to:
- Query a `profiles` table that doesn't exist or has wrong structure
- Use database functions that haven't been created yet
- Access user-level relationships through incorrect table structure

## 🚀 Complete Solution

You need to run **TWO** migration files in the correct order:

### Step 1: Create Student Profile Table

1. **Open Supabase Dashboard** → Go to SQL Editor
2. **Copy and paste** the entire content from `migrations/create_student_profile_table.sql`
3. **Click "Run"** to execute the migration

**What this does:**
- Creates `student_profile` table with proper user-level relationships
- Sets up RLS policies for security
- Creates automatic profile creation on user signup
- Updates database functions to use the new table structure

### Step 2: Add User Activation Features

1. **In the same SQL Editor**, copy and paste content from `migrations/add_user_activation_and_functions.sql`
2. **Click "Run"** to execute the second migration

**What this does:**
- Adds user activation fields and subscription management
- Creates the missing database functions
- Sets up admin role management
- Adds exercise visibility controls

## 🔍 Verification Steps

### Step 1: Check Tables Exist
```sql
-- Check if student_profile table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'student_profile';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_accessible_exercises', 'can_access_exercise');
```

### Step 2: Test the Relationship
```sql
-- Test student_profile to levels relationship
SELECT 
  sp.id,
  sp.user_id,
  l.title as level_title
FROM student_profile sp
LEFT JOIN levels l ON sp.level_id = l.id
LIMIT 5;
```

### Step 3: Test Functions
```sql
-- Test the function (replace with actual user ID)
SELECT * FROM get_user_accessible_exercises('your-user-id-here') LIMIT 3;
```

## 🛠️ Database Schema After Fix

```
auth.users (Supabase managed)
├── id (UUID)
├── email
└── raw_user_meta_data

student_profile (your new table)
├── id (UUID)
├── user_id → auth.users.id
├── level_id → levels.id
├── is_active (BOOLEAN)
├── subscription_start_date
├── subscription_end_date
├── payment_status
└── ... (other subscription fields)

levels
├── id (UUID)
├── title
└── description

exercises
├── id (UUID)
├── name
├── is_public (BOOLEAN) ← Added by migration
└── ... (other exercise fields)
```

## 🎯 What Gets Fixed

✅ **Student Profile Queries**: Code can now query `student_profile` table with proper relationships
✅ **Level Associations**: Users are properly linked to their educational levels
✅ **Database Functions**: All missing RPC functions are created and working
✅ **Exercise Access Control**: Users can access exercises based on their subscription status
✅ **Admin Management**: Admins can manage student activations and subscriptions

## 🔧 Code Changes Made

The following files have been updated with fallback mechanisms:
- `src/lib/api/students.ts` - Updated to use `student_profile` table
- `src/lib/api/exercises.ts` - Added fallbacks for missing functions
- `src/components/ExerciseCard.tsx` - Added error handling

## 🚨 Important Notes

1. **Run migrations in order**: `create_student_profile_table.sql` FIRST, then `add_user_activation_and_functions.sql`
2. **Backup your data**: Always backup before running migrations
3. **Test thoroughly**: Verify all functionality after running migrations
4. **Admin setup**: You'll need to assign admin roles manually after migration

## 🐛 Troubleshooting

### If migration fails:
1. Check if all referenced tables exist (`levels`, `exercises`, `chapters`, `subjects`)
2. Ensure you have proper permissions in Supabase
3. Run migrations one section at a time if needed

### If relationships still don't work:
1. Verify `levels` table exists and has data
2. Check that `student_profile` table was created successfully
3. Ensure RLS policies are not blocking access

### If functions still missing:
1. Check function creation in SQL Editor
2. Verify permissions are granted correctly
3. Try refreshing your application

## 🎉 After Running Migrations

1. **Refresh your application**
2. **Test user registration** with level selection
3. **Verify exercise access** works correctly
4. **Check admin dashboard** for student management

The errors should be completely resolved! 🚀