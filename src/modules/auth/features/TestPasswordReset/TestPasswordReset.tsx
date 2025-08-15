import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../../lib/supabase'
import './_TestPasswordReset.scss'

const TestPasswordReset = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const testPasswordReset = async () => {
    if (!email) {
      setError('Please enter an email address')
      return
    }

    setIsLoading(true)
    setError('')
    setResult('')

    try {
      console.log('🧪 Testing password reset for:', email)
      console.log('🔗 Redirect URL:', `${window.location.origin}/reset-password`)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error('❌ Test failed:', error)
        setError(`Test failed: ${error.message}`)
        setResult('❌ FAILED')
      } else {
        console.log('✅ Test successful')
        setResult('✅ SUCCESS - Check your email for the reset link')
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err)
      setError(`Unexpected error: ${err.message}`)
      setResult('❌ FAILED')
    } finally {
      setIsLoading(false)
    }
  }

  const checkSupabaseConfig = () => {
    console.log('🔍 Checking Supabase configuration...')
    console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('🔑 Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
    console.log('🌐 Current origin:', window.location.origin)
    console.log('🔗 Expected redirect:', `${window.location.origin}/reset-password`)
    
    setResult('🔍 Configuration logged to console')
  }

  return (
    <div className="test-password-reset">
      <h2>🧪 Password Reset Test</h2>
      <p>This component helps debug password reset configuration issues.</p>
      
      <div className="test-section">
        <h3>1. Check Configuration</h3>
        <button onClick={checkSupabaseConfig} className="test-btn">
          Check Supabase Config
        </button>
      </div>

      <div className="test-section">
        <h3>2. Test Password Reset</h3>
        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test"
            className="email-input"
          />
          <button 
            onClick={testPasswordReset} 
            disabled={isLoading}
            className="test-btn"
          >
            {isLoading ? 'Testing...' : 'Send Test Reset'}
          </button>
        </div>
      </div>

      {result && (
        <div className="result-section">
          <h3>Result:</h3>
          <div className={`result ${result.includes('✅') ? 'success' : 'error'}`}>
            {result}
          </div>
        </div>
      )}

      {error && (
        <div className="error-section">
          <h3>Error:</h3>
          <div className="error">{error}</div>
        </div>
      )}

      <div className="instructions">
        <h3>📋 Instructions:</h3>
        <ol>
          <li>Click "Check Supabase Config" to verify your setup</li>
          <li>Enter a test email and click "Send Test Reset"</li>
          <li>Check your email for the reset link</li>
          <li>Examine the URL - it should contain tokens</li>
          <li>Check browser console for detailed logs</li>
        </ol>
        
        <h3>🔗 Expected URL Format:</h3>
        <code>http://localhost:4000/reset-password?access_token=xxx&refresh_token=yyy</code>
        
        <h3>⚠️ If URL has no tokens:</h3>
        <ul>
          <li>Check Supabase project settings</li>
          <li>Verify redirect URLs are configured</li>
          <li>Check email templates</li>
        </ul>
      </div>
    </div>
  )
}

export default TestPasswordReset
