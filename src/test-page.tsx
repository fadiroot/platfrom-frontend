import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { getLevels } from './lib/api/levels'

const TestPage: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...')
  const [results, setResults] = useState<any>({})

  useEffect(() => {
    const runTests = async () => {
      const testResults: any = {}
      
      try {
        // Test 1: Basic Supabase connection
        setStatus('Testing Supabase connection...')
        testResults.connection = {
          url: import.meta.env.VITE_SUPABASE_URL,
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          status: 'Connected'
        }

        // Test 2: Auth status
        setStatus('Checking auth status...')
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        testResults.auth = {
          user: user ? { id: user.id, email: user.email } : null,
          error: authError?.message || null
        }

        // Test 3: Direct levels query (bypassing our API)  
        setStatus('Testing direct levels query...')
        const { data: levelsData, error: levelsError } = await supabase
          .from('levels')
          .select('*')
          .limit(5)
        
        testResults.directLevels = {
          count: levelsData?.length || 0,
          data: levelsData || [],
          error: levelsError?.message || null
        }

        // Test 4: Using our API
        setStatus('Testing levels API...')
        try {
          const apiLevels = await getLevels()
          testResults.apiLevels = {
            count: apiLevels.length,
            data: apiLevels,
            error: null
          }
        } catch (apiError: any) {
          testResults.apiLevels = {
            count: 0,
            data: [],
            error: apiError.message
          }
        }

        // Test 5: Profile test (if user exists)
        if (user) {
          setStatus('Testing profile access...')
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
          
          testResults.profile = {
            exists: !!profileData,
            data: profileData,
            error: profileError?.message || null
          }
        }

        setStatus('Tests completed!')
        setResults(testResults)

      } catch (error: any) {
        setStatus(`Test failed: ${error.message}`)
        setResults({ globalError: error.message })
      }
    }

    runTests()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Supabase Connection Test</h1>
      <p><strong>Status:</strong> {status}</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Results:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '8px',
          overflow: 'auto',
          maxHeight: '500px'
        }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      {results.directLevels?.count > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>✅ Good News!</h2>
          <p>Found {results.directLevels.count} levels in the database. The connection is working!</p>
        </div>
      )}

      {results.apiLevels?.error && (
        <div style={{ marginTop: '2rem', color: 'red' }}>
          <h2>❌ API Error</h2>
          <p>Direct query works but API fails: {results.apiLevels.error}</p>
        </div>
      )}
    </div>
  )
}

export default TestPage