# 🔧 Supabase Password Reset Setup Guide

This guide will help you configure Supabase for proper password reset functionality.

## 🚨 Current Issue

The password reset flow is showing "رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية" (Password reset token is invalid or expired) because the reset link is not including the required tokens.

## 🔧 Required Configuration

### 1. Supabase Project Settings

1. **Go to your Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Configure Authentication Settings**
   - Go to **Authentication** > **Settings**
   - Scroll down to **URL Configuration**

3. **Add Redirect URLs**
   ```
   http://localhost:4000/reset-password
   http://localhost:4000/email-confirmation
   ```

4. **Save the configuration**

### 2. Email Templates

1. **Go to Authentication** > **Email Templates**
2. **Edit the "Reset Password" template**
3. **Ensure the template includes the correct redirect URL**

### 3. Environment Variables

Make sure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔍 Debugging Steps

### Step 1: Test Password Reset Email

1. Go to your app's forgot password page
2. Enter a valid email address
3. Check the email for the reset link
4. Examine the URL structure

### Step 2: Check URL Format

The reset link should look like one of these formats:

**Format 1 (Query Parameters):**
```
http://localhost:4000/reset-password?access_token=xxx&refresh_token=yyy
```

**Format 2 (Hash Fragment):**
```
http://localhost:4000/reset-password#access_token=xxx&refresh_token=yyy&type=recovery
```

**Format 3 (Code Parameter):**
```
http://localhost:4000/reset-password?code=xxx&type=recovery
```

### Step 3: Check Browser Console

Open the browser console when clicking the reset link and look for:

```
🔍 Validating password reset tokens...
📍 Current URL: [the actual URL]
🔗 URL params: [parameters found]
📋 Hash params: [hash parameters]
🔗 Fragment params: [fragment parameters]
```

## 🛠️ Troubleshooting

### Issue 1: "No valid tokens found in URL"

**Cause:** The reset link is not including the required tokens
**Solution:** 
1. Check Supabase project settings
2. Verify redirect URLs are configured
3. Check email templates

### Issue 2: "Session expired" error

**Cause:** Tokens are present but invalid or expired
**Solution:**
1. Request a new password reset
2. Check if tokens are being properly extracted

### Issue 3: "Invalid session" error

**Cause:** Session cannot be established with the tokens
**Solution:**
1. Check if the user exists in Supabase
2. Verify the tokens are in the correct format

## 🔧 Code Fixes Applied

### 1. Enhanced Token Detection

The ResetPassword component now checks for tokens in multiple locations:
- Query parameters (`?access_token=xxx&refresh_token=yyy`)
- Hash fragments (`#access_token=xxx&refresh_token=yyy`)
- Fragment parameters (alternative parsing method)
- Code parameters (`?code=xxx&type=recovery`)

### 2. Improved Error Handling

- Better error messages in Arabic, English, and French
- Comprehensive logging for debugging
- Graceful fallback for different token formats

### 3. Session Management

- Proper session establishment with tokens
- Automatic session detection from URL
- Better error handling for session issues

## 🧪 Testing

Run the test script to verify the configuration:

```bash
node test-reset-flow.js
```

This will:
1. Test URL parsing for different formats
2. Attempt to send a password reset email
3. Provide debugging information

## 📞 Support

If the issue persists after following this guide:

1. Check the browser console for detailed error messages
2. Verify your Supabase project configuration
3. Test with a fresh password reset request
4. Check if the issue occurs with all users or specific ones

## ✅ Success Criteria

The password reset flow is working correctly when:

1. ✅ Password reset email is sent successfully
2. ✅ Reset link contains valid tokens
3. ✅ User can access the reset password page
4. ✅ User can enter a new password
5. ✅ Password is updated successfully
6. ✅ User is redirected to login page
