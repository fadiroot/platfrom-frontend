# Fix Signup Levels Issue

## Problem Description

During the signup process, the levels dropdown appears empty (shows as an empty array) even though there are levels in the database. This happens because:

1. **RLS Policy Restriction**: The levels table has an RLS policy that requires authentication (`auth.role() = 'authenticated'`)
2. **Signup Context**: During signup, users are not yet authenticated, so they can't access the levels table
3. **Empty Array Result**: The API call fails due to RLS restrictions, returning an empty array

## Root Cause Analysis

### Current RLS Policy (Problematic)
```sql
CREATE POLICY "Authenticated users can read levels" ON public.levels
  FOR SELECT USING (auth.role() = 'authenticated');
```

This policy blocks access to levels during signup because:
- Users are not authenticated during signup
- The policy requires `auth.role() = 'authenticated'`
- This causes the levels fetch to fail

### Application Code Issue
The Register component uses `fetchLevels()` which requires authentication, but during signup, users are not authenticated yet.

## Solution

### 1. Database Fix (RLS Policy Update)

**File**: `fix-signup-levels-issue.sql`

This script:
- Drops the restrictive authentication policy
- Creates a new public read access policy
- Adds sample levels if none exist
- Verifies the fix

**Run the fix**:
```bash
psql -h your-db-host -U your-db-user -d your-db-name -f fix-signup-levels-issue.sql
```

### 2. Application Code Fix

**Files Modified**:

#### A. Enhanced Levels API (`src/lib/api/levels.ts`)
- Added `getPublicLevels()` function for unauthenticated access
- Better error handling for public access

#### B. Updated Level Thunk (`src/modules/levels/data/levelThunk.ts`)
- Added `fetchPublicLevels()` thunk for signup process
- Handles public level fetching without authentication

#### C. Updated Level Slice (`src/modules/levels/data/levelSlice.ts`)
- Added handlers for `fetchPublicLevels`
- Maintains backward compatibility

#### D. Updated Register Component (`src/modules/auth/features/Register/Register.tsx`)
- Changed from `fetchLevels()` to `fetchPublicLevels()`
- Uses public access for signup process

### 3. Security Considerations

The fix maintains security by:
- **Admin Operations**: Still require admin privileges (create, update, delete)
- **Public Read Access**: Only allows reading levels (needed for signup)
- **Other Tables**: Remain protected with proper RLS policies
- **Admin Bypass**: Admins still have full access to all operations

## Implementation Steps

### Step 1: Apply Database Fix
```bash
# Run the comprehensive fix script
psql -h your-db-host -U your-db-user -d your-db-name -f fix-signup-levels-issue.sql
```

### Step 2: Verify Database Changes
The script will show:
- Current levels count
- Existing levels
- RLS policies before and after
- Verification of public access

### Step 3: Test the Fix
1. **Clear browser cache** and local storage
2. **Navigate to signup page**
3. **Check levels dropdown** - should now show available levels
4. **Complete signup process** - should work with level selection

### Step 4: Verify Admin Access
1. **Log in as admin**
2. **Navigate to admin dashboard**
3. **Check level management** - should still work properly
4. **Test level CRUD operations** - should work as expected

## Expected Results

### Before Fix
- Levels dropdown: Empty array `[]`
- Console errors: RLS policy violations
- Signup process: Fails or incomplete

### After Fix
- Levels dropdown: Shows available levels
- Console: No RLS errors
- Signup process: Works completely with level selection

## Troubleshooting

### Issue: Still Empty Levels
1. **Check database**: Run the fix script again
2. **Check RLS policies**: Verify public read access is enabled
3. **Check levels table**: Ensure levels exist in database
4. **Clear cache**: Clear browser cache and local storage

### Issue: Admin Functions Broken
1. **Check admin policies**: Ensure admin bypass policies exist
2. **Verify admin role**: Check if user has admin privileges
3. **Test admin access**: Try admin-specific operations

### Issue: Other Tables Affected
1. **Check other policies**: Verify other tables still have proper RLS
2. **Test other functionality**: Ensure other features still work
3. **Review changes**: Only levels table should be affected

## Files Created/Modified

### New Files
- `fix-signup-levels-issue.sql` - Comprehensive database fix
- `create-sample-levels.sql` - Sample levels creation
- `fix-levels-access-signup.sql` - RLS policy fix
- `FIX_SIGNUP_LEVELS_ISSUE.md` - This guide

### Modified Files
- `src/lib/api/levels.ts` - Added public levels function
- `src/modules/levels/data/levelThunk.ts` - Added public levels thunk
- `src/modules/levels/data/levelSlice.ts` - Added public levels handlers
- `src/modules/auth/features/Register/Register.tsx` - Updated to use public levels

## Verification Checklist

- [ ] Database fix script runs successfully
- [ ] Levels table has data (check count > 0)
- [ ] RLS policies show public read access for levels
- [ ] Signup page shows levels in dropdown
- [ ] Signup process completes successfully
- [ ] Admin level management still works
- [ ] Other admin functions unaffected
- [ ] No console errors during signup

## Summary

This fix addresses the signup levels issue by:
1. **Allowing public read access** to levels table for signup
2. **Maintaining security** for admin operations
3. **Providing sample data** if levels don't exist
4. **Updating application code** to use appropriate API calls

The solution is secure, comprehensive, and maintains backward compatibility while fixing the signup experience.
