import routes, { renderRoutes } from '../modules/shared/routes'
import { useAppSelector } from '../modules/shared/store'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import ProfileCompletionGuard from '../modules/auth/guards/ProfileCompletionGuard'
import { observePlaceholderDirection } from '../utils/placeholderDirection'
import { useEffect } from 'react'
import newLogo from '/logo/astuceLogo.png'

const App = () => {
  // get translation.json file from public/locales
  const { i18n  } = useTranslation('translation')

  // Always keep LTR direction, but apply Arabic fonts when Arabic is selected
  document.body.dir = 'ltr'
  
  // Add Arabic font class when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  if (isArabic) {
    document.body.classList.add('arabic-fonts')
  } else {
    document.body.classList.remove('arabic-fonts')
  }

  // Set HTML lang attribute dynamically based on selected language
  document.documentElement.lang = i18n?.language || 'en'

  // Initialize placeholder direction observer
  useEffect(() => {
    const observer = observePlaceholderDirection()
    
    // Cleanup observer on unmount
    return () => {
      observer.disconnect()
    }
  }, [i18n?.language]) // Re-run when language changes

  const theme = useAppSelector((state: { theme: { mode: string } }) => state.theme.mode)

  return (
    <div id={theme}>
      <Helmet>
        <title>Welcome - Astuce</title>
        <link rel="icon" type="image/png" href={newLogo} />
      </Helmet>

      <ProfileCompletionGuard>
        {renderRoutes(routes)}
      </ProfileCompletionGuard>
    </div>
  )
}

export default App
