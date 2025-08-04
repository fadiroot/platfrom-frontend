"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "../../store"
import { logout } from "../../../auth/data/authThunk"
import "./_Header.scss"
import logoImg from '../../assets/images/Black & Blue Minimalist Modern Initial Font Logo (3).png'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  const handleDashboardClick = () => {
    navigate('/dashboard')
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="professional-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="logo-container">
            <div className="logo-wrapper">
              <img src={logoImg || "/placeholder.svg"} alt="Educational Platform Logo" className="logo-image" />
            </div>
            <div className="brand-info">
              <h1 className="brand-title">المنصة لي تنجحك</h1>
              <p className="brand-subtitle">Educational Excellence Platform</p>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="page-title">
            <span className="title-text">ALGORITHMS</span>
            <div className="title-underline"></div>
          </div>
        </div>

        <div className="header-actions">
          {isAuthenticated && (
            <div className="dashboard-section">
              <button 
                className="dashboard-btn"
                onClick={handleDashboardClick}
                title="Dashboard"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span className="dashboard-text">Dashboard</span>
              </button>
            </div>
          )}
          
          {isAuthenticated && (
            <div className="logout-section">
              <button 
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="logout-text">Logout</span>
              </button>
            </div>
          )}
          
          <div className="user-section">
            <div className="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {isAuthenticated && user && (
                <span className="user-name">{user.name || user.email}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
