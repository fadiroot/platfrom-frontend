# STEP-BY-STEP FIX FOR PASSWORD RESET ISSUE

## 🚨 **CURRENT PROBLEM**
Your password reset link is: `http://localhost:4000/reset-password` (no tokens)
This means the Supabase email template is not configured correctly.

## 🔧 **FOLLOW THESE STEPS EXACTLY**

### **STEP 1: Check Your Supabase Project**

1. **Open your Supabase Dashboard**
2. **Find your project URL** (it should look like: `https://supabase.com/dashboard/project/[PROJECT-ID]`)
3. **Make sure you're in the correct project**

### **STEP 2: Update Email Template**

1. **In your Supabase Dashboard, go to:**
   - **Authentication** → **Email Templates**

2. **Click on "Reset Password" template**

3. **Check what the current template looks like**

4. **If it looks like this (WRONG):**
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset the password for your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
   ```

5. **Change it to this (CORRECT):**
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset the password for your user:</p>
   <p>
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
       Reset Password
     </a>
   </p>
   ```

6. **Click "Save"**

### **STEP 3: Configure Redirect URLs**

1. **In your Supabase Dashboard, go to:**
   - **Authentication** → **URL Configuration**

2. **Add these redirect URLs:**
   ```
   http://localhost:4000/reset-password
   http://localhost:4000/auth/confirm
   ```

3. **Set Site URL to:**
   ```
   http://localhost:4000
   ```

4. **Click "Save"**

### **STEP 4: Test the Fix**

1. **Wait 2-3 minutes** for changes to take effect

2. **Go to your forgot password page**

3. **Enter your email address**

4. **Request a password reset**

5. **Check your email**

6. **Look at the reset link format**

### **STEP 5: Verify the Fix**

**Before fix:** `http://localhost:4000/reset-password` (no tokens)
**After fix:** `http://localhost:4000/auth/confirm?token_hash=abc123&type=recovery&next=/reset-password` (with tokens)

## 🔍 **TROUBLESHOOTING**

### **If the email template doesn't save:**
- Make sure you clicked "Save"
- Wait a few minutes
- Try refreshing the page

### **If you still get the old email format:**
- Clear your browser cache
- Wait 5-10 minutes
- Check if you're in the correct Supabase project

### **If the redirect URL doesn't work:**
- Make sure the URL is exactly: `http://localhost:4000/reset-password`
- Check that it's in the allowed redirect URLs list
- Verify the Site URL is set correctly

## 📧 **EMAIL TEMPLATE EXPLANATION**

The key difference is:
- **Old (wrong):** `{{ .ConfirmationURL }}` - This gives you a direct link to reset-password
- **New (correct):** `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` - This gives you a link with tokens

## ✅ **SUCCESS CHECKLIST**

After following these steps, you should see:
- [ ] Email template updated and saved
- [ ] Redirect URLs configured
- [ ] Site URL set correctly
- [ ] New password reset email contains tokens
- [ ] ResetPassword component detects tokens
- [ ] User can reset password successfully

## 🆘 **IF STILL NOT WORKING**

1. **Double-check you're in the correct Supabase project**
2. **Verify the email template was saved**
3. **Check that redirect URLs are added**
4. **Wait 10 minutes and try again**
5. **Test with a different email address**

---

**The issue is 100% the email template configuration. Follow these steps exactly and it will work.**
