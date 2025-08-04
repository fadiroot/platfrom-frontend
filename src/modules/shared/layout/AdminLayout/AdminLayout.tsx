import { useEffect, useRef, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar'
import AdminHeader from '@/modules/dashboard/components/AdminHeader'
import './_AdminLayout.scss'

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [collapseSidebar, setCollapseSidebar] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef?.current?.contains(e?.target as Node)) {
        setShowSidebar(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [])

  return (
    <div className="admin-layout">
      <div
        ref={menuRef}
        className={`admin-layout__sidebar ${
          showSidebar ? 'admin-layout__sidebar--mobile-visible' : ''
        } ${collapseSidebar ? 'admin-layout__sidebar--collapsed' : ''}`}
      >
        <Sidebar collapseSidebar={collapseSidebar} />
      </div>

      <div className="admin-layout__main">
        <AdminHeader 
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onToggleCollapse={() => setCollapseSidebar(!collapseSidebar)}
        />
        
        <div className="admin-layout__content">
          {children}
        </div>
      </div>

      {showSidebar && (
        <div 
          className="admin-layout__overlay"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}

export default AdminLayout