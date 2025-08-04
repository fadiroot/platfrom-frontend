import routes, { renderRoutes } from '../modules/shared/routes'
import { useAppSelector } from '../modules/shared/store'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import newLogo from '../modules/shared/assets/images/Black & Blue Minimalist Modern Initial Font Logo (3).png'

const App = () => {
  // get translation.json file from public/locales
  const { i18n } = useTranslation('translation')

  // Always keep LTR direction, but apply Arabic fonts when Arabic is selected
  document.body.dir = 'ltr'
  
  // Add Arabic font class when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  if (isArabic) {
    document.body.classList.add('arabic-fonts')
  } else {
    document.body.classList.remove('arabic-fonts')
  }

  const theme = useAppSelector((state: { theme: { mode: string } }) => state.theme.mode)

  return (
    <div id={theme}>
      <Helmet>
        <title>Welcome - GoMyDesk</title>
        <link rel="icon" type="image/png" href={newLogo} />
      </Helmet>

      {renderRoutes(routes)}
    </div>
  )
}

export default App
