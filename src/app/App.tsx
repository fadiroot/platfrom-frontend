import routes, { renderRoutes } from '../modules/shared/routes'
import { useAppSelector } from '../modules/shared/store'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import newLogo from '../modules/shared/assets/images/Black & Blue Minimalist Modern Initial Font Logo (3).png'
import Header from '../modules/shared/components/Header/Header'

const App = () => {
  // get translation.json file from public/locales
  const { i18n } = useTranslation('translation')

  document.body.dir = i18n?.dir()

  const theme = useAppSelector((state: { theme: { mode: string } }) => state.theme.mode)

  return (
    <div id={theme}>
      <Header title="ALGORITHMS" />
      <Helmet>
        <title>Welcome - GoMyDesk</title>
        <link rel="icon" type="image/png" href={newLogo} />
      </Helmet>

      {renderRoutes(routes)}
    </div>
  )
}

export default App
