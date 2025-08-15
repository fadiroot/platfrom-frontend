# FINDING THE RESET PASSWORD TEMPLATE

## 🔍 **You're looking at the wrong template!**

What you showed me is the **Magic Link** template, but we need to update the **Reset Password** template.

## 📍 **How to Find the Reset Password Template:**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project dashboard
2. Navigate to: **Authentication** → **Email Templates**

### **Step 2: Look for "Reset Password" Template**
You should see multiple templates:
- ✅ **Magic Link** (this is what you showed me)
- ✅ **Confirm Signup** 
- ✅ **Invite User**
- ✅ **Reset Password** ← **THIS IS THE ONE WE NEED**

### **Step 3: Click on "Reset Password"**
Click on the **Reset Password** template (not Magic Link)

### **Step 4: Check Current Content**
The Reset Password template probably looks like this:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### **Step 5: Update to Correct Format**
Replace the content with:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
    Reset Password
  </a>
</p>
```

### **Step 6: Save**
Click the **Save** button

## 🔍 **Template Comparison:**

| Template | Purpose | Current Format | Correct Format |
|----------|---------|----------------|----------------|
| **Magic Link** | Login without password | `{{ .ConfirmationURL }}` | ✅ Already correct |
| **Reset Password** | Reset forgotten password | `{{ .ConfirmationURL }}` | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` |

## 🎯 **What You Need to Do:**

1. **Find the "Reset Password" template** (not Magic Link)
2. **Update it with the correct format**
3. **Save the changes**
4. **Test with a new password reset request**

## ❓ **Still Can't Find It?**

If you can't find the Reset Password template, please:
1. Take a screenshot of your Email Templates page
2. Or tell me what templates you see listed
3. Or check if you're in the correct Supabase project

---

**The Magic Link template you showed is fine - we need to update the Reset Password template instead!**
