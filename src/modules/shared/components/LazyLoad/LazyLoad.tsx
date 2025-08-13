import { useEffect } from 'react'
import Loader from '../Loader/Loader'

interface ILazyLoadProps {
  showSpinner?: boolean
}

const LazyLoad: React.FC<ILazyLoadProps> = ({ showSpinner = true }) => {
  useEffect(() => {
    // Component is loading, no additional setup needed
    return () => {
      // Cleanup if needed
    }
  }, [])

  if (!showSpinner) {
    return null
  }

  return <Loader fullScreen />
}

export default LazyLoad
