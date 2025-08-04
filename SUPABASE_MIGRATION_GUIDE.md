# 🚀 Supabase Migration Guide

This guide will help you migrate your educational platform from .NET backend to Supabase.

## 📋 Prerequisites

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Note down your Project URL and API Key

2. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Example:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Setup

1. **Run the Migration**
   - Copy the contents of `supabase-migration.sql`
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Paste and run the migration

2. **Enable Authentication**
   - Go to Authentication > Settings
   - Configure your auth providers
   - Set up email templates if needed

## 📁 Files Created/Modified

### New Files:
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/api/auth.ts` - Authentication service
- `src/lib/api/levels.ts` - Levels service
- `src/lib/api/subjects.ts` - Subjects service
- `src/lib/api/chapters.ts` - Chapters service
- `src/lib/api/exercises.ts` - Exercises service
- `supabase-migration.sql` - Database schema

### Modified Files:
- `src/modules/auth/data/authThunk.ts` - Updated to use Supabase Auth
- `src/modules/auth/data/authSlice.ts` - Updated to handle Supabase responses
- `src/modules/levels/data/levelThunk.ts` - Updated to use Supabase API

## 🔄 Component Updates Needed

### 1. Update Subject List Component

Replace the axios call in `src/modules/subjects/features/subjectList/subjectList.tsx`:

```typescript
// OLD - .NET API
axios.get(`http://localhost:5234/api/subjects/by-level/${levelId}`)

// NEW - Supabase
import { getSubjectsByLevel } from '../../../lib/api/subjects'
// Then use: await getSubjectsByLevel(levelId)
```

### 2. Update Chapters List Component

Replace in `src/modules/chapters/features/chaptersList/chaptersList.tsx`:

```typescript
// OLD - .NET API
import { getChaptersBySubject, getChaptersByLevel } from '../../utils/axios'

// NEW - Supabase
import { getChaptersBySubject, getChaptersByLevel } from '../../../lib/api/chapters'
```

### 3. Update Exercises List Component

Replace in `src/modules/exercices/features/exercicesList/exercicesList.tsx`:

```typescript
// OLD - .NET API
import { getExercisesBySubject } from '../../utils/axios'

// NEW - Supabase
import { getExercisesByChapter } from '../../../lib/api/exercises'
```

## 🔐 Authentication Updates

### Initialize Auth in App.tsx

Add this to your `src/app/App.tsx`:

```typescript
import { useEffect } from 'react'
import { useAppDispatch } from '../modules/shared/store'
import { initializeAuth, setupAuthListener } from '../modules/auth/data/authThunk'

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Initialize auth state
    dispatch(initializeAuth())
    
    // Setup auth state listener
    const { data: { subscription } } = setupAuthListener(dispatch)
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [dispatch])

  // ... rest of your app
}
```

## 📊 Data Migration

To migrate existing data from your .NET database to Supabase:

1. **Export Data** from your .NET database
2. **Transform Data** to match Supabase schema
3. **Import Data** using Supabase SQL Editor or client

Example data transformation:
```sql
-- Insert levels
INSERT INTO public.levels (title, description) VALUES 
('Beginner', 'Introduction to programming'),
('Intermediate', 'Advanced concepts'),
('Advanced', 'Expert level');

-- Insert subjects
INSERT INTO public.subjects (title, description, level_id) VALUES 
('Data Structures', 'Learn DS&A', (SELECT id FROM levels WHERE title = 'Beginner'));
```

## 🗄️ File Storage

For PDF files (exercise and correction files):

1. **Enable Storage** in Supabase dashboard
2. **Create Buckets** for exercises and corrections
3. **Update Upload Logic** to use Supabase Storage

```typescript
// Upload file to Supabase Storage
import { supabase } from '../lib/supabase'

const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file)
  
  if (error) throw error
  return data
}
```

## ✅ Testing Checklist

- [ ] Database tables created successfully
- [ ] Authentication works (login/register/logout)
- [ ] User profiles are created on registration
- [ ] Levels can be fetched and displayed
- [ ] Subjects can be fetched by level
- [ ] Chapters can be fetched by subject
- [ ] Exercises can be fetched by chapter
- [ ] User progress tracking works
- [ ] File uploads work (if implemented)
- [ ] RLS policies are working correctly

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your domain is added to Supabase allowed origins
2. **RLS Policies**: Check if Row Level Security policies allow your operations
3. **Environment Variables**: Ensure `.env` file is correctly configured
4. **Auth Callbacks**: Set up correct redirect URLs for auth flows

### Debugging:

```typescript
// Add this to debug Supabase operations
import { supabase } from '../lib/supabase'

// Log auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session)
})

// Log database operations
const { data, error } = await supabase.from('levels').select('*')
console.log('Data:', data, 'Error:', error)
```

## 🎯 Next Steps

1. Set up your Supabase project
2. Run the database migration
3. Update your environment variables
4. Install Supabase client library
5. Update your components to use new API
6. Test authentication flow
7. Migrate your existing data
8. Deploy your updated application

Need help? Check the [Supabase Documentation](https://supabase.com/docs) or create an issue in your repository.