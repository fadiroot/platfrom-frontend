# 📦 Package Dependencies Update

## Required New Dependencies

Add these dependencies to your `package.json`:

```bash
# Supabase client library
npm install @supabase/supabase-js

# If you need additional TypeScript types (optional)
npm install --save-dev @types/node
```

## Updated package.json dependencies section

Add this to your existing `package.json` dependencies:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    // ... your existing dependencies
  }
}
```

## Remove Old Dependencies (Optional)

You can remove these if you're no longer using them after migration:

```bash
# Remove axios if you're completely switching to Supabase
npm uninstall axios

# Remove any JWT-related packages if you were handling tokens manually
npm uninstall jsonwebtoken @types/jsonwebtoken
```

## Installation Command

Run this command to install the required dependencies:

```bash
npm install @supabase/supabase-js@^2.39.0
```

## Verify Installation

After installation, verify that Supabase is properly installed:

```bash
npm list @supabase/supabase-js
```

You should see output like:
```
your-project@1.0.0 /path/to/your/project
└── @supabase/supabase-js@2.39.0
```