import { Link, useLocation } from 'react-router-dom'
import { SIDEBARITEMS } from '../Sidebar/items'
import { useTranslation } from 'react-i18next'

interface ISidebarItemsProps {
  collapseSidebar: boolean
}

const SidebarItems: React.FC<ISidebarItemsProps> = ({ collapseSidebar }) => {
  const { pathname } = useLocation()
  const { t } = useTranslation('sidebar')

  const getTranslationKey = (label: string) => {
    // Map the French labels to their translation keys
    const labelMap: { [key: string]: string } = {
      'Dashboard': 'dashboard',
      'Niveaux': 'niveaux',
      'Matières': 'matières',
      'Chapitres': 'chapitres',
      'Exercices': 'exercices',
      'Étudiants': 'étudiants'
    }
    return labelMap[label] || label.toLowerCase()
  }

  return (
    <div className="sidebar-items">
      {SIDEBARITEMS?.map((route, index) => {
        const translationKey = getTranslationKey(route?.label)
        return (
          <Link
            to={route?.link}
            key={index}
            className={`item ${pathname === route?.link && 'active'}`}
          >
            <div
              className={`link-icon-stroke-color ${
                pathname === route?.link && 'link-icon-stroke-color-active'
              }`}
            >
              {route?.icon}
            </div>
            {!collapseSidebar ? t(`sidebar.${translationKey}`).toUpperCase() : null}
          </Link>
        )
      })}
    </div>
  )
}

export default SidebarItems
