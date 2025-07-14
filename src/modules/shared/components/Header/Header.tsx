"use client"

import React from "react"
import "./_Header.scss"
import logoImg from '../../assets/images/Black & Blue Minimalist Modern Initial Font Logo (3).png'

const Header: React.FC = () => {
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
          <div className="user-section">
            <div className="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
