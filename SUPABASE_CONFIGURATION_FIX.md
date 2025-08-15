# 🔧 Supabase Configuration Fix for Password Reset & Email Confirmation

## 🚨 Problem
Both password reset and email confirmation links from Gmail contain **NO tokens** in the URL parameters, causing errors:
- Password Reset: "رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية" (Password reset token is invalid or expired)
- Email Confirmation: "Email link is invalid or has expired"

## 🔍 Root Cause
The Supabase project is not properly configured to include tokens in authentication links.

## 🛠️ Step-by-Step Fix

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project

### Step 2: Configure Authentication Settings
1. Navigate to **Authentication** > **Settings**
2. Scroll down to **URL Configuration**

### Step 3: Add Redirect URLs
Add these URLs to the **Redirect URLs** field:
```
http://localhost:4000/reset-password
http://localhost:4000/email-confirmation
http://localhost:4000/auth/callback
```

### Step 4: Configure Site URL
Set the **Site URL** to:
```
http://localhost:4000
```

### Step 5: Save Configuration
Click **Save** to apply the changes.

### Step 6: Test the Fix
1. **Test Password Reset**: Go to `http://localhost:4000/test-password-reset`
2. **Test Email Confirmation**: Register a new account and check the confirmation email
3. Both links should now include tokens like:
   ```
   http://localhost:4000/reset-password?access_token=xxx&refresh_token=yyy
   http://localhost:4000/email-confirmation?access_token=xxx&refresh_token=yyy
   ```

## 🔧 Alternative Configuration

If the above doesn't work, try this alternative approach:

### Option 1: Use Production URLs
If you're testing on a production domain, add:
```
https://yourdomain.com/reset-password
https://yourdomain.com/email-confirmation
https://yourdomain.com/auth/callback
```

### Option 2: Use Wildcard URLs
For development, you can use:
```
http://localhost:*/reset-password
http://localhost:*/email-confirmation
```

## 🧪 Testing Tools

### 1. Test Component
Access the test component at: `http://localhost:4000/test-password-reset`

This component will:
- ✅ Check your Supabase configuration
- ✅ Test password reset email sending
- ✅ Provide detailed debugging information

### 2. Console Logging
Check the browser console for detailed logs:
```
🔧 Sending password reset email to: your@email.com
🔗 Redirect URL: http://localhost:4000/reset-password
🌐 Current origin: http://localhost:4000
```

### 3. Email Link Inspection
When you receive authentication emails:
1. Right-click the link
2. Copy the URL
3. Check if it contains `access_token` and `refresh_token` parameters

## 🚨 Common Issues & Solutions

### Issue 1: "No redirect URLs configured"
**Solution:** Add the redirect URLs in Step 3 above

### Issue 2: "Invalid redirect URL"
**Solution:** Make sure the URL exactly matches what's configured

### Issue 3: "Email sent but no tokens in link"
**Solution:** Check email templates in Supabase dashboard

### Issue 4: "Site URL not configured"
**Solution:** Set the Site URL in Step 4 above

### Issue 5: "Email confirmation fails"
**Solution:** Ensure email confirmation redirect URL is configured

## 📧 Email Template Configuration

1. Go to **Authentication** > **Email Templates**
2. Edit the **"Reset Password"** template
3. Edit the **"Confirm Signup"** template
4. Ensure both templates include the correct redirect URL
5. The templates should use: `{{ .ConfirmationURL }}`

## 🔍 Verification Checklist

After applying the fix, verify:

- [ ] Redirect URLs are configured in Supabase
- [ ] Site URL is set correctly
- [ ] Email templates are properly configured
- [ ] Test component shows successful configuration
- [ ] Password reset email contains tokens in the URL
- [ ] Email confirmation email contains tokens in the URL
- [ ] Both pages load without errors

## 🆘 If Still Not Working

1. **Check Environment Variables**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Verify Project Settings**
   - Ensure you're using the correct project
   - Check if the project is active

3. **Check Email Templates**
   - Verify templates use the correct redirect URL
   - Test with a fresh email

4. **Contact Support**
   - Check Supabase status page
   - Review Supabase documentation
   - Contact Supabase support if needed

## ✅ Success Indicators

The fix is working when:
- ✅ Password reset email is sent successfully
- ✅ Email confirmation email is sent successfully
- ✅ Both links contain `access_token` and `refresh_token`
- ✅ Both pages load without errors
- ✅ Users can successfully reset passwords
- ✅ Users can successfully confirm emails
- ✅ Users are redirected to login page after operations

## 🔄 Next Steps

After fixing the configuration:
1. Test both password reset and email confirmation flows end-to-end
2. Remove the test component from production
3. Update any production URLs if needed
4. Monitor for any remaining issues
