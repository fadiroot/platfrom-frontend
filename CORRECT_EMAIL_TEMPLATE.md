# CORRECT EMAIL TEMPLATE FOR SUPABASE PASSWORD RESET

## 🚨 **CURRENT ISSUE**
Your password reset link is: `http://localhost:4000/reset-password` (no tokens)
This means the Supabase email template is not configured correctly.

## 🔧 **CORRECT EMAIL TEMPLATE FORMAT**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project dashboard
2. Navigate to: **Authentication** → **Email Templates**
3. Click on **"Reset Password"** template

### **Step 2: Update the Template**

**Replace the current content with this EXACT format:**

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p>
  <a href="{{ .SiteURL }}/reset-password?code={{ .TokenHash }}&type=recovery">
    Reset Password
  </a>
</p>
```

**OR this alternative format:**

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p>
  <a href="{{ .ConfirmationURL }}">
    Reset Password
  </a>
</p>
```

### **Step 3: Configure Redirect URLs**

1. **Go to: Authentication** → **URL Configuration**
2. **Add these redirect URLs:**
   ```
   http://localhost:4000/reset-password
   ```
3. **Set Site URL to:**
   ```
   http://localhost:4000
   ```
4. **Click "Save"**

## 🔍 **WHY THIS WORKS**

### **Format 1 (Recommended):**
- Uses `{{ .TokenHash }}` which provides the `code` parameter
- Uses `{{ .SiteURL }}` to build the correct URL
- Results in: `http://localhost:4000/reset-password?code=abc123&type=recovery`

### **Format 2 (Alternative):**
- Uses `{{ .ConfirmationURL }}` which Supabase builds automatically
- Supabase handles the URL construction
- Results in: `http://localhost:4000/reset-password?code=abc123&type=recovery`

## 🧪 **TESTING**

### **Step 1: Save the Template**
1. Click **Save** after updating the template
2. Wait 2-3 minutes for changes to take effect

### **Step 2: Request Password Reset**
1. Go to your forgot password page
2. Enter your email address
3. Click "Send Reset Link"

### **Step 3: Check Email**
The email should contain a link like:
```
http://localhost:4000/reset-password?code=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&type=recovery
```

### **Step 4: Test the Link**
1. Click the link in the email
2. Check browser console for:
   ```
   ✅ Found code parameter for PKCE flow, validating...
   ✅ PKCE flow code validated successfully
   ```

## 🔍 **DEBUGGING**

### **If you still get no tokens:**
1. **Check you're in the correct Supabase project**
2. **Verify the template was saved**
3. **Wait 5-10 minutes for changes to propagate**
4. **Clear browser cache**
5. **Try with a different email address**

### **If you get errors:**
1. **Check the console logs for specific error messages**
2. **Verify the redirect URLs are configured correctly**
3. **Ensure the Site URL is set to `http://localhost:4000`**

## ✅ **SUCCESS INDICATORS**

After the fix, you should see:
- [ ] Email contains a link with `?code=` parameter
- [ ] ResetPassword component detects the code
- [ ] Console shows "✅ Found code parameter for PKCE flow"
- [ ] User can successfully reset their password

---

**The key is using `{{ .TokenHash }}` or `{{ .ConfirmationURL }}` in the email template, not `{{ .ConfirmationURL }}` alone.**
