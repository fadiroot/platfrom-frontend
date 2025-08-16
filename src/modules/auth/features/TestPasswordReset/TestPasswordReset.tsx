"use client"

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '../../../shared/store'
import { requestPasswordReset } from '../../data/authThunk'
import { PATH } from '../../routes/paths'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import { supabase } from '../../../../lib/supabase'
import './_TestPasswordReset.scss'
import logoImg from '/logo/astuceLogo.png'

const TestPasswordResetComponent = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const result = await dispatch(requestPasswordReset(email))
      
      if (requestPasswordReset.fulfilled.match(result)) {
        setMessage('Password reset email sent successfully! Check your email.')
        setMessageType('success')
      } else {
        setMessage(result.payload as string || 'Failed to send reset email')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An error occurred while sending the reset email')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate(PATH.LOGIN)
  }

  const testMagicLink = () => {
    // Test different magic link formats
    const testLinks = [
      'http://localhost:4000/reset-password?access_token=test&refresh_token=test',
      'http://localhost:4000/reset-password?token_hash=test&type=recovery',
      'http://localhost:4000/auth/confirm?access_token=test&refresh_token=test',
      'http://localhost:4000/auth/confirm?token_hash=test&type=email',
    ]
    
    console.log('Test magic links:')
    testLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link}`)
    })
  }

  return (
    <div className="test-password-reset-module">
      <div className="language-selector-container">
        <LanguageSelector />
      </div>
      <div className="test-password-reset-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>
        
        <button 
          type="button" 
          className="back-link"
          onClick={handleBackToLogin}
        >
          ← Back to Login
        </button>
        
        <h1 className="title">Test Password Reset</h1>
        <p className="subtitle">
          This page helps test the password reset flow and debug magic links.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email" className="label">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="input"
              required
            />
          </div>

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="test-section">
          <h3>Debug Information</h3>
          <button 
            type="button" 
            className="debug-button"
            onClick={testMagicLink}
          >
            Log Test Magic Links
          </button>
          
          <div className="debug-info">
            <h4>Current URL Parameters:</h4>
            <pre>{JSON.stringify({
              search: window.location.search,
              hash: window.location.hash,
              pathname: window.location.pathname
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestPasswordResetComponent
