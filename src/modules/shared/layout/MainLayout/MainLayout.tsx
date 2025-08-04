import React from 'react'
import StudentHeader from '../../components/StudentHeader/StudentHeader'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="main-layout">
      <StudentHeader />
      <div className="main-layout-content">
        {children}
      </div>
    </div>
  )
}

export default MainLayout
