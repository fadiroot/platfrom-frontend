# Immediate Fixes for User Management

## 🚨 **Current Issue**
The admin dashboard shows "0" for all user counts and has multiple failed network requests because:
1. The UserManagement component was trying to import from non-existent functions
2. The API calls were targeting RPC functions that don't exist in your database
3. RLS policies may be blocking access

## ✅ **Fixes Applied**

### 1. **Fixed UserManagement Component** (`src/modules/dashboard/features/UserManagement.tsx`)
- ✅ Updated imports to use correct API functions from `admin.ts`
- ✅ Fixed data structure to match `AdminStudentProfile` interface
- ✅ Updated activate/deactivate functions to use correct API calls
- ✅ Added proper status badge handling for 'expired' status
- ✅ Fixed statistics calculation

### 2. **Updated CSS** (`src/modules/dashboard/features/UserManagement.scss`)
- ✅ Added `.expired` status badge style

### 3. **Created Database Setup Script** (`setup-student-management-basic.sql`)
- ✅ Creates `is_admin()` function
- ✅ Creates sample levels and student profiles
- ✅ Sets up proper RLS policies
- ✅ Grants necessary permissions

### 4. **Created Test Page** (`test-user-management-basic.html`)
- ✅ Tests database connectivity
- ✅ Tests admin function
- ✅ Tests student profile fetching
- ✅ Displays student data in table format

## 🚀 **Next Steps**

### **Step 1: Apply Database Fixes**
Run this SQL script in your Supabase SQL editor:
```sql
-- Copy and paste the contents of setup-student-management-basic.sql
```

### **Step 2: Test the System**
Open this file in your browser:
```
test-user-management-basic.html
```

### **Step 3: Verify Admin Dashboard**
1. Log in as an admin user
2. Navigate to `/admin/users`
3. Check if user data is now displayed

## 🔧 **What Was Fixed**

### **Before (Broken)**
```typescript
// ❌ Non-existent imports
import { getAllUsersWithStatus, activateUserAccount, deactivateUserAccount } from '@/lib/api/userManagement'

// ❌ Non-existent RPC calls
const userData = await getAllUsersWithStatus()
```

### **After (Fixed)**
```typescript
// ✅ Correct imports
import { getStudentProfiles, activateStudentAccount, deactivateStudentAccount } from '@/lib/api/admin'

// ✅ Working API calls
const userData = await getStudentProfiles()
```

## 📊 **Expected Results**

After applying these fixes:

### ✅ **User Management Dashboard**
- Student profiles will be displayed in the table
- Statistics cards will show correct counts
- Activate/deactivate buttons will work
- Search and filters will function

### ✅ **Data Display**
- User names, emails, levels will be shown
- Account status (Active/Inactive/Expired) will be correct
- Subscription dates will be displayed
- Payment information will be visible

## 🐛 **Troubleshooting**

### **If Still Showing "0" Counts**
1. Check if you're logged in as an admin user
2. Verify the `is_admin()` function returns `true`
3. Check browser console for any remaining errors
4. Use the test page to verify database connectivity

### **If API Calls Still Failing**
1. Ensure the SQL script was executed successfully
2. Check if sample data was created
3. Verify RLS policies are in place
4. Test with the provided test page

### **If Admin Access Denied**
1. Check your user role in `auth.users` table
2. Ensure `user_metadata->>'role' = 'admin'`
3. Verify the `is_admin()` function works

## 📝 **Quick Verification**

Run these queries in Supabase SQL editor to verify setup:

```sql
-- Check if levels exist
SELECT COUNT(*) FROM public.levels;

-- Check if student profiles exist
SELECT COUNT(*) FROM public.student_profile;

-- Test admin function
SELECT public.is_admin();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'student_profile';
```

## 🎯 **Success Criteria**

The user management system is working correctly when:
- ✅ Dashboard shows actual user counts (not 0)
- ✅ Student profiles are displayed in the table
- ✅ Activate/deactivate buttons work
- ✅ No network errors in browser console
- ✅ Admin functions are accessible

Once this basic functionality is working, we can proceed with implementing the RLS policies for admin-only access to student profiles.
