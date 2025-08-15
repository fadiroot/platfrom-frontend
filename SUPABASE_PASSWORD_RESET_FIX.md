# Supabase Password Reset Fix Guide

## Problem
The password reset links are returning error parameters instead of valid tokens:
```
http://localhost:4000/reset-password?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

## Root Cause
Your Supabase project is likely configured for the **implicit flow** but the ResetPassword component is expecting the **PKCE flow** parameters.

## Solution

### Step 1: Configure Supabase Email Templates for PKCE Flow

1. **Go to your Supabase Dashboard**
   - Navigate to [Auth > Email Templates](https://supabase.com/dashboard/project/_/auth/templates)

2. **Update the "Reset Password" email template**
   - Select the "Reset Password" template
   - Replace the current content with:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
    >Reset Password</a
  >
</p>
```

3. **Update the "Confirm Signup" email template** (if needed)
   - Select the "Confirm Signup" template
   - Replace the current content with:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard"
    >Confirm your email</a
  >
</p>
```

### Step 2: Create Auth Confirmation Endpoint

Create a new file at `src/routes/auth/confirm/+server.ts` (or similar based on your framework):

```typescript
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from '@sveltejs/kit' // or your framework's redirect

export const GET = async (event) => {
  const {
    url,
    locals: { supabase },
  } = event
  const token_hash = url.searchParams.get('token_hash') as string
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/'

  /**
   * Clean up the redirect URL by deleting the Auth flow parameters.
   */
  const redirectTo = new URL(url)
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      redirectTo.searchParams.delete('next')
      redirect(303, redirectTo)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/auth/error'
  redirect(303, redirectTo)
}
```

### Step 3: Configure Redirect URLs

1. **Go to your Supabase Dashboard**
   - Navigate to [Auth > URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration)

2. **Add these redirect URLs:**
   ```
   http://localhost:4000/auth/confirm
   http://localhost:4000/reset-password
   https://yourdomain.com/auth/confirm
   https://yourdomain.com/reset-password
   ```

3. **Set your Site URL:**
   - For development: `http://localhost:4000`
   - For production: `https://yourdomain.com`

### Step 4: Update ForgotPassword Component

Make sure your ForgotPassword component uses the correct redirect URL:

```typescript
const handleResetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  if (error) {
    console.error('Error sending reset email:', error)
  } else {
    // Show success message
  }
}
```

### Step 5: Test the Flow

1. **Request a password reset** from your forgot password page
2. **Check the email** - it should contain a link like:
   ```
   http://localhost:4000/auth/confirm?token_hash=abc123&type=recovery&next=/reset-password
   ```
3. **Click the link** - it should redirect to `/reset-password` with valid session
4. **Reset your password** - the form should work without errors

## Alternative: Use Implicit Flow

If you prefer to keep the implicit flow, update your email template to:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>
<p>
  <a href="{{ .ConfirmationURL }}">Reset Password</a>
</p>
```

And update the ResetPassword component to handle the implicit flow parameters (`access_token` and `refresh_token`).

## Debugging

### Check Current Configuration

1. **Email Templates**: Verify the templates use `{{ .TokenHash }}` and `{{ .SiteURL }}`
2. **Redirect URLs**: Ensure `/auth/confirm` and `/reset-password` are in the allowed list
3. **Site URL**: Make sure it matches your development/production URL

### Common Issues

1. **"Invalid redirect URL"**: Add the redirect URLs to your Supabase project
2. **"Token expired"**: Check if the email template is using the correct variables
3. **"No session"**: Ensure the auth confirmation endpoint is properly set up

### Testing Locally

1. **Use Mailpit** (if using Supabase CLI):
   ```bash
   supabase status
   # Look for Mailpit URL and check emails there
   ```

2. **Check browser console** for detailed error messages
3. **Verify URL parameters** in the reset password link

## Summary

The main issue is that your Supabase project needs to be configured for the PKCE flow with:
- Updated email templates using `{{ .TokenHash }}`
- Auth confirmation endpoint at `/auth/confirm`
- Proper redirect URLs configured
- Correct Site URL setting

This will ensure that password reset links work correctly and provide valid tokens to your ResetPassword component.

## 🔧 **IMMEDIATE FIXES NEEDED:**

### 1. **Update Supabase Email Template (CRITICAL)**
Go to your Supabase Dashboard → Auth → Email Templates → "Reset Password" and change it to:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
    >Reset Password</a
  >
</p>
```

### 2. **Add Redirect URLs**
Go to Supabase Dashboard → Auth → URL Configuration and add:
```
http://localhost:4000/auth/confirm
http://localhost:4000/reset-password
```

### 3. **Set Site URL**
In the same URL Configuration page, set Site URL to:
```
http://localhost:4000
```

### 4. **Test the Flow**
1. Request a password reset
2. Check the email link format
3. Click the link and verify it redirects to `/reset-password` with valid session

The ResetPassword component is now updated to handle both PKCE and implicit flows, but the email template configuration is the most critical fix needed.
