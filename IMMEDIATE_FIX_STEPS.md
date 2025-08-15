# IMMEDIATE FIX FOR PASSWORD RESET ISSUE

## 🚨 **PROBLEM IDENTIFIED**
Your password reset link is: `http://localhost:4000/reset-password` (no tokens)
This means the Supabase email template is not configured correctly.

## 🔧 **IMMEDIATE FIXES (DO THESE NOW)**

### **Step 1: Check Your Email Template (CRITICAL)**

1. **Go to your Supabase Dashboard**
2. **Navigate to: Auth → Email Templates**
3. **Click on "Reset Password" template**
4. **Check what the current template looks like**

**If it looks like this (WRONG):**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

**Change it to this (CORRECT for PKCE flow):**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
    Reset Password
  </a>
</p>
```

**OR this (CORRECT for implicit flow):**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p>
  <a href="{{ .ConfirmationURL }}">
    Reset Password
  </a>
</p>
```

### **Step 2: Configure Redirect URLs**

1. **Go to: Auth → URL Configuration**
2. **Add these redirect URLs:**
   ```
   http://localhost:4000/reset-password
   http://localhost:4000/auth/confirm
   ```
3. **Set Site URL to:**
   ```
   http://localhost:4000
   ```

### **Step 3: Test the Fix**

1. **Request a new password reset**
2. **Check the email link format**
3. **The link should now contain tokens**

## 🔍 **DEBUGGING STEPS**

### **Run this in your browser console:**
```javascript
// Copy and paste this into your browser console on the reset-password page
console.log('🔍 Current URL:', window.location.href)
console.log('🔍 URL Params:', new URLSearchParams(window.location.search))
console.log('🔍 Hash Params:', new URLSearchParams(window.location.hash.substring(1)))
```

### **Expected Results:**
- **Before fix:** `http://localhost:4000/reset-password` (no tokens)
- **After fix:** `http://localhost:4000/reset-password?access_token=xxx&refresh_token=yyy` OR `http://localhost:4000/auth/confirm?token_hash=xxx&type=recovery&next=/reset-password`

## 🚨 **COMMON ISSUES**

### **Issue 1: Email template not saving**
- Make sure to click "Save" after updating the template
- Wait a few minutes for changes to take effect

### **Issue 2: Still getting old email format**
- Clear your browser cache
- Wait 5-10 minutes for Supabase to update
- Check if you're using the correct Supabase project

### **Issue 3: Redirect URL not working**
- Make sure the redirect URL is exactly: `http://localhost:4000/reset-password`
- Check that it's added to the allowed redirect URLs list

## 📧 **EMAIL TEMPLATE VARIABLES**

| Variable | Description | Use Case |
|----------|-------------|----------|
| `{{ .ConfirmationURL }}` | Full confirmation URL | Implicit flow |
| `{{ .TokenHash }}` | Token hash for PKCE | PKCE flow |
| `{{ .SiteURL }}` | Your site URL | Building custom URLs |
| `{{ .Token }}` | 6-digit OTP code | Manual entry |

## ✅ **SUCCESS INDICATORS**

After the fix, you should see:
1. ✅ Email link contains tokens
2. ✅ ResetPassword component detects tokens
3. ✅ User can reset password successfully
4. ✅ No more "No valid tokens found" errors

## 🆘 **IF STILL NOT WORKING**

1. **Check Supabase project settings**
2. **Verify you're using the correct project**
3. **Test with a different email address**
4. **Check Supabase logs for errors**
5. **Contact Supabase support if needed**

---

**The main issue is 99% likely the email template configuration. Update it and test again.**
