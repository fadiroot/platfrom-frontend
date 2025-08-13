"use client"

import type React from "react"
import "./_Navbar.scss"
import menuIcon from "../../assets/icons/navbar/menu.svg"
import { useLocation } from "react-router-dom"
import ThemeButton from "../ThemeButton/ThemeButton"
import { Avatar, Button, Dropdown, type MenuProps, Space, Badge, Tooltip } from "antd"
import enFlagIcon from "../../assets/icons/Navbar/en-flag.png"
import frFlagIcon from "../../assets/icons/Navbar/fr-flag.png"
import arFlagIcon from "../../assets/icons/Navbar/ar-flag.png"
import { ReactComponent as ProfileIcon } from "../../assets/icons/sidebar/profile.svg"
import { ReactComponent as SettingsIcon } from "../../assets/icons/navbar/settings.svg"
import { ReactComponent as LogoutIcon } from "../../assets/icons/navbar/logout.svg"
import { useAppDispatch } from "../../store"
import { logout } from "../../../auth/data/authThunk"
import { useTranslation } from "react-i18next"
import { useState } from "react"

interface INavbarProps {
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>
  setCollapseSidebar: React.Dispatch<React.SetStateAction<boolean>>
  collapseSidebar: boolean
}

const Navbar: React.FC<INavbarProps> = ({ setShowSidebar, setCollapseSidebar, collapseSidebar }) => {
  const { pathname } = useLocation()
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation("translation")
  const [lang, setLang] = useState(i18n?.language?.toString())

  const onChangeLanguage = (language: string) => {
    i18n.changeLanguage(language)
    setLang(language)
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  // Get page title from pathname
  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace("-", " ")
  }

  const languagesItems: MenuProps["items"] = [
    {
      key: "en",
      label: (
        <div className="language-item" onClick={() => onChangeLanguage("en")}>
          <img src={enFlagIcon || "/placeholder.svg"} alt="English" className="language-flag" />
          <span className="language-name">{t("language.en")}</span>
          {lang === "en" && <div className="language-active-indicator" />}
        </div>
      ),
    },
    {
      key: "fr",
      label: (
        <div className="language-item" onClick={() => onChangeLanguage("fr")}>
          <img src={frFlagIcon || "/placeholder.svg"} alt="French" className="language-flag" />
          <span className="language-name">{t("language.fr")}</span>
          {lang === "fr" && <div className="language-active-indicator" />}
        </div>
      ),
    },
    {
      key: "ar",
      label: (
        <div className="language-item" onClick={() => onChangeLanguage("ar")}>
          <img src={arFlagIcon || "/placeholder.svg"} alt="Arabic" className="language-flag" />
          <span className="language-name">{t("language.ar")}</span>
          {lang === "ar" && <div className="language-active-indicator" />}
        </div>
      ),
    },
  ]

  const accountInfoItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="user-info-section">
          <div className="user-avatar-container">
            <Avatar size={48} className="user-avatar">
              TG
            </Avatar>
            <div className="user-status-indicator" />
          </div>
          <div className="user-details">
            <p className="user-name">Tarek Gzgz</p>
            <p className="user-email">tarekgzgz@gmail.com</p>
            <div className="user-role-badge">Administrator</div>
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "profile",
      label: (
        <div className="menu-item">
          <div className="menu-item-icon">
            <ProfileIcon className="menu-icon" />
          </div>
          <div className="menu-item-content">
            <span className="menu-item-title">Profile Settings</span>
            <span className="menu-item-subtitle">Manage your account</span>
          </div>
        </div>
      ),
    },
    {
      key: "settings",
      label: (
        <div className="menu-item">
          <div className="menu-item-icon">
            <SettingsIcon className="menu-icon" />
          </div>
          <div className="menu-item-content">
            <span className="menu-item-title">Account Settings</span>
            <span className="menu-item-subtitle">Privacy & security</span>
          </div>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: (
        <div className="menu-item logout-item" onClick={handleLogout}>
          <div className="menu-item-icon">
            <LogoutIcon className="menu-icon" />
          </div>
          <div className="menu-item-content">
            <span className="menu-item-title">Sign Out</span>
            <span className="menu-item-subtitle">End your session</span>
          </div>
        </div>
      ),
    },
  ]

  return (
    <nav className="professional-navbar">
      <div className="navbar-container">
        {/* Left Section */}
        <div className="navbar-left">
          <Tooltip title="Toggle Menu" placement="bottom">
            <Button
              type="text"
              icon={<img src={menuIcon || "/placeholder.svg"} alt="menu" className="menu-icon" />}
              className="menu-button mobile-menu"
              onClick={() => {
                setCollapseSidebar(false)
                setShowSidebar(true)
              }}
            />
          </Tooltip>

          <Tooltip title={collapseSidebar ? "Expand Sidebar" : "Collapse Sidebar"} placement="bottom">
            <Button
              type="text"
              icon={<img src={menuIcon || "/placeholder.svg"} alt="menu" className="menu-icon" />}
              className="menu-button desktop-menu"
              onClick={() => setCollapseSidebar(!collapseSidebar)}
            />
          </Tooltip>

          {/* Brand Section */}
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-icon">
                <img src="/logo/astuceLogo.png" alt="Platform Logo" className="logo-image" />
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Page Info */}
        <div className="navbar-center">
          <div className="page-info">
            <h2 className="page-title">{getPageTitle(pathname)}</h2>
            <div className="page-breadcrumb">
              <span className="breadcrumb-item">Home</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{getPageTitle(pathname)}</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          <Space size={16} className="navbar-actions">
            {/* Language Selector */}
            <Tooltip title="Change Language" placement="bottom">
              <Dropdown
                menu={{ items: languagesItems }}
                trigger={["click"]}
                placement="bottomRight"
                overlayClassName="professional-language-dropdown"
              >
                <Button type="text" className="language-selector">
                  <div className="language-flag-container">
                    <img
                      src={lang === "en" ? enFlagIcon : lang === "fr" ? frFlagIcon : arFlagIcon}
                      alt="Current Language"
                      className="current-flag"
                    />
                  </div>
                </Button>
              </Dropdown>
            </Tooltip>

            {/* Theme Toggle */}
            <div className="theme-toggle-container">
              <ThemeButton />
            </div>

            {/* User Profile */}
            <Dropdown
              menu={{ items: accountInfoItems }}
              trigger={["click"]}
              placement="bottomRight"
              overlayClassName="professional-user-dropdown"
            >
              <Button type="text" className="user-profile-trigger">
                <div className="user-profile-container">
                  <Badge dot status="success" offset={[-4, 4]} size="small">
                    <Avatar size={36} className="navbar-user-avatar">
                      TG
                    </Avatar>
                  </Badge>
                  <div className="user-info-preview">
                    <span className="user-name-preview">Tarek</span>
                    <span className="user-role-preview">Admin</span>
                  </div>
                </div>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
