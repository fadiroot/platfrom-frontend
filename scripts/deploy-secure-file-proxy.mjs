#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const FUNCTION_NAME = 'secure-file-proxy'
const FUNCTION_PATH = join(process.cwd(), 'supabase', 'functions', FUNCTION_NAME)

console.log('🚀 Deploying Secure File Proxy Edge Function...')

try {
  // Check if Supabase CLI is installed
  try {
    execSync('supabase --version', { stdio: 'ignore' })
  } catch (error) {
    console.error('❌ Supabase CLI is not installed. Please install it first:')
    console.error('   npm install -g supabase')
    process.exit(1)
  }

  // Deploy the function
  console.log(`📦 Deploying function: ${FUNCTION_NAME}`)
  execSync(`supabase functions deploy ${FUNCTION_NAME}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('✅ Secure File Proxy Edge Function deployed successfully!')
  console.log('')
  console.log('🔒 Security Features:')
  console.log('   • File URLs are hidden from network tab')
  console.log('   • Access control enforced server-side')
  console.log('   • Temporary signed URLs with 1-hour expiration')
  console.log('   • User authentication required')
  console.log('')
  console.log('📝 Usage:')
  console.log('   The ExerciseViewer will now use proxy URLs instead of direct file URLs')
  console.log('   Network tab will show: /functions/v1/secure-file-proxy?exerciseId=...')
  console.log('   Instead of: /storage/v1/object/public/exercise-files/...')

} catch (error) {
  console.error('❌ Failed to deploy function:', error.message)
  process.exit(1)
}
