# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication in your Supabase project and test it in your frontend application.

## Prerequisites

- A Supabase project with authentication enabled
- A Google Cloud Console project with OAuth 2.0 credentials
- Your frontend application running locally

## Step 1: Set up Google OAuth in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create a project

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - For development: `https://your-project-ref.supabase.co/auth/v1/callback`
     - For production: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Note down your Client ID and Client Secret

## Step 2: Configure Google OAuth in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to your project dashboard
   - Go to "Authentication" > "Providers"

2. **Enable Google Provider**
   - Find "Google" in the providers list
   - Toggle it to "Enabled"
   - Enter your Google OAuth credentials:
     - **Client ID**: Your Google OAuth Client ID
     - **Client Secret**: Your Google OAuth Client Secret
   - Save the configuration

3. **Configure Redirect URLs**
   - In the Google provider settings, add these redirect URLs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)

## Step 3: Test the Setup

1. **Run the test script**
   ```bash
   node scripts/test-google-oauth.mjs
   ```

2. **Start your development server**
   ```bash
   npm run dev
   ```

3. **Test the OAuth flow**
   - Navigate to `/login` or `/register`
   - Click the "Continue with Google" button
   - Complete the Google OAuth flow
   - You should be redirected back to your app and logged in

## Step 4: Verify User Profile Creation

When a user signs in with Google for the first time:

1. **Profile Completion Flow**
   - New OAuth users will see a profile completion modal
   - They must select their level (class) and provide a phone number
   - Users can skip profile completion and complete it later
   - The modal shows the user's Google profile information (name, email, avatar)

2. **Database Records**
   - A new user record will be created in `auth.users`
   - A student profile will be created in `student_profile` table after profile completion
   - Phone number is stored in user metadata (`auth.users.user_metadata.phone`)
   - Level ID is stored in both user metadata and student_profile table

3. **User data from Google**
   - Email address
   - First name and last name (if available)
   - Profile picture (if available)

## Step 5: Profile Completion Flow

The profile completion flow works as follows:

1. **Automatic Detection**: The system automatically detects if a user needs to complete their profile
2. **Modal Display**: A modal appears asking for:
   - Level selection (required)
   - Phone number (required)
3. **User Options**:
   - **Complete Profile**: Fill in the required information
   - **Skip for now**: Skip profile completion and continue to the app
4. **Data Storage**: 
   - Level ID: Stored in both user metadata and student_profile table
   - Phone number: Stored in user metadata (`auth.users.user_metadata.phone`)

### Profile Completion Modal Features

- **User Info Display**: Shows Google profile picture, name, and email
- **Level Selection**: Dropdown with available levels from your database
- **Phone Validation**: Validates phone number format (Tunisian format: 8 digits starting with 2, 4, 5, or 9)
- **Responsive Design**: Works on all device sizes
- **Multi-language Support**: Full i18n support
- **Error Handling**: Proper validation and error messages

### Database Structure

- **student_profile table**: Contains `user_id`, `level_id`, `is_active`, etc.
- **auth.users table**: Contains user metadata including `phone` and `levelId`
- **Phone number**: Stored in `auth.users.user_metadata.phone`
- **Level ID**: Stored in both `auth.users.user_metadata.levelId` and `student_profile.level_id`

## Troubleshooting

### Common Issues

1. **"Provider not enabled" error**
   - Make sure Google provider is enabled in Supabase
   - Verify your Client ID and Client Secret are correct

2. **Redirect URI mismatch**
   - Ensure the redirect URI in Google Cloud Console matches your Supabase callback URL
   - Check that your frontend callback URL is correct

3. **User profile not created**
   - Check the browser console for errors
   - Verify the `ensureStudentProfile` function is working
   - Check that you have at least one level in your `levels` table

4. **CORS issues**
   - Make sure your domain is added to authorized origins in Google Cloud Console
   - Check that your Supabase project URL is correct

### Debug Steps

1. **Check browser console** for any JavaScript errors
2. **Check network tab** for failed requests
3. **Verify environment variables** are set correctly
4. **Test Supabase connection** using the test script

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Considerations

1. **Never expose your Client Secret** in frontend code
2. **Use HTTPS** in production
3. **Validate redirect URIs** to prevent open redirect attacks
4. **Implement proper error handling** for OAuth failures
5. **Consider rate limiting** for OAuth requests

## Production Deployment

1. **Update redirect URIs** in Google Cloud Console with your production domain
2. **Update Supabase settings** with production callback URLs
3. **Test the OAuth flow** in production environment
4. **Monitor logs** for any authentication issues

## Support

If you encounter issues:

1. Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
2. Check the [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
3. Review the browser console and network logs
4. Test with the provided test script

## Files Modified

The following files were added/modified to implement Google OAuth:

- `src/lib/api/auth.ts` - Added OAuth functions
- `src/modules/auth/data/authThunk.ts` - Added OAuth thunks
- `src/modules/auth/data/authSlice.ts` - Added OAuth state management
- `src/modules/auth/features/Login/Login.tsx` - Added Google sign-in button
- `src/modules/auth/features/Register/Register.tsx` - Added Google sign-in button
- `src/modules/auth/features/OAuthCallback/OAuthCallback.tsx` - New OAuth callback component
- `src/modules/auth/routes/paths.ts` - Added OAuth callback path
- `src/modules/auth/routes/routes.tsx` - Added OAuth callback route
- Translation files - Added OAuth-related translations
- `scripts/test-google-oauth.mjs` - Test script for OAuth setup
