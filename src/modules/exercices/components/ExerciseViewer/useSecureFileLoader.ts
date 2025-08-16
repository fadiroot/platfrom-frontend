import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SecureFileLoaderResult {
  blobUrls: string[]
  loading: boolean
  error: string | null
}

export const useSecureFileLoader = (proxyUrls: string[]): SecureFileLoaderResult => {
  const [blobUrls, setBlobUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSecureFiles = async () => {
      if (proxyUrls.length === 0) {
        setBlobUrls([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No authentication token available')
        }

        // Fetch all files with authentication
        const fetchPromises = proxyUrls.map(async (proxyUrl) => {
          const response = await fetch(proxyUrl, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/pdf'
            }
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
          }

          const blob = await response.blob()
          return URL.createObjectURL(blob)
        })

        const urls = await Promise.all(fetchPromises)
        setBlobUrls(urls)
      } catch (err: any) {
        console.error('Error loading secure files:', err)
        setError(err.message || 'Failed to load files')
        setBlobUrls([])
      } finally {
        setLoading(false)
      }
    }

    loadSecureFiles()

    // Cleanup function to revoke blob URLs when component unmounts
    return () => {
      blobUrls.forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [proxyUrls])

  return { blobUrls, loading, error }
}
