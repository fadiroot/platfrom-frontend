'use client'

import type React from 'react'
import { useState, useEffect } from 'react'

import './ExerciseViewer.scss'
import type { Exercise } from '../../types/exercise'

interface ExerciseViewerProps {
  exercise: Exercise
  onClose: () => void
}

const validUrl = (url: string) => url && url !== 'string'

const ExerciseViewer: React.FC<ExerciseViewerProps> = ({ exercise, onClose }) => {

  const [activeTab, setActiveTab] = useState<'exercise' | 'correction' | 'hybrid'>('exercise')
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const exerciseFiles = exercise.exerciseFileUrls.filter(validUrl)
  const correctionFiles = exercise.correctionFileUrls.filter(validUrl)
  const files = activeTab === 'exercise' ? exerciseFiles : correctionFiles
  const fileLabel = activeTab === 'exercise' ? 'Exercise' : 'Solution'

  const handleTabClick = (tab: 'exercise' | 'correction' | 'hybrid') => {
    setActiveTab(tab)
    setSelectedFileIdx(0)
  }

  const handleFileClick = (idx: number) => {
    setSelectedFileIdx(idx)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleClose = () => {
    // Remove the history entry we added when opening
    window.history.back()
    onClose()
  }

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      onClose()
    }

    // Add a history entry when component mounts
    window.history.pushState({ exerciseViewer: true }, '', window.location.pathname)

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth <= 768 && !sidebarCollapsed) {
        const target = event.target as Element
        if (!target.closest('.exercise-sidebar') && !target.closest('.sidebar-toggle')) {
          setSidebarCollapsed(true)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarCollapsed])

  const getFileTypeBadge = (url: string) => {
    if (url.endsWith('.pdf')) return { label: 'PDF', type: 'pdf' }
    if (url.endsWith('.svg')) return { label: 'SVG', type: 'svg' }
    if (url.endsWith('.png')) return { label: 'PNG', type: 'png' }
    if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return { label: 'JPG', type: 'jpg' }
    return { label: 'FILE', type: 'file' }
  }

  const getFileIcon = (url: string) => {
    if (url.endsWith('.pdf'))
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      )
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    )
  }

  return (
    <div
      className={`exercise-viewer ${
        !sidebarCollapsed && window.innerWidth <= 768 ? 'sidebar-open' : ''
      }`}
    >
      {/* Sidebar Toggle Button - Always Visible */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {sidebarCollapsed ? (
            <path d="m9 18 6-6-6-6" />
          ) : (
            <>
              <path d="M3 12h18" />
              <path d="M3 6h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
      </button>

      {/* Left Sidebar Navigation */}
      <div className={`exercise-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {!sidebarCollapsed && (
          <>
            {/* Header */}
            <div className="sidebar-header">
              <button className="back-button" onClick={handleClose}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Exercises
              </button>
              <h1 className="exercise-title">{exercise.name}</h1>
            </div>

            {/* Navigation Tabs */}
            <nav className="sidebar-nav">
              <button
                className={`nav-tab ${activeTab === 'exercise' ? 'active' : ''}`}
                onClick={() => handleTabClick('exercise')}
              >
                <div className="nav-content">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  <span className="nav-label">Exercise Files</span>
                </div>
                <span className="nav-count">{exerciseFiles.length}</span>
              </button>

              <button
                className={`nav-tab ${activeTab === 'correction' ? 'active' : ''}`}
                onClick={() => handleTabClick('correction')}
              >
                <div className="nav-content">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="#fff"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22,4 12,14.01 9,11.01" />
                  </svg>
                  <span className="nav-label">Solutions</span>
                </div>
                <span className="nav-count">{correctionFiles.length}</span>
              </button>

              <button
                className={`nav-tab ${activeTab === 'hybrid' ? 'active' : ''}`}
                onClick={() => handleTabClick('hybrid')}
              >
                <div className="nav-content">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span className="nav-label">Side by Side</span>
                </div>
                <span className="nav-count">{exerciseFiles.length + correctionFiles.length}</span>
              </button>
            </nav>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="exercise-content">
        {activeTab !== 'hybrid' ? (
          files.length === 0 ? (
            <div className="no-files">
              <div className="no-files-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>No {fileLabel.toLowerCase()} files available</h3>
              <p>Check back later or contact your instructor</p>
            </div>
          ) : (
            <div className="file-viewer-container">
              {/* File Preview */}
              <div className="file-preview-card">
                <div className="file-preview-header">
                  <h2>{fileLabel} Preview</h2>
                  <div className="file-info">
                    <span
                      className={`file-type-badge ${getFileTypeBadge(files[selectedFileIdx]).type}`}
                    >
                      {getFileTypeBadge(files[selectedFileIdx]).label}
                    </span>
                    <span className="file-counter">
                      {selectedFileIdx + 1} of {files.length}
                    </span>
                  </div>
                </div>
                <div className="file-preview-area">
                  <div className="file-display">
                    {files[selectedFileIdx].endsWith('.pdf') ? (
                      <iframe
                        src={files[selectedFileIdx]}
                        title={`${fileLabel} PDF ${selectedFileIdx + 1}`}
                        className="pdf-viewer"
                      />
                    ) : (
                      <img
                        src={files[selectedFileIdx] || '/placeholder.svg'}
                        alt={`${fileLabel} File ${selectedFileIdx + 1}`}
                        className="image-viewer"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* File Navigation */}
              {files.length > 1 && (
                <div className="file-navigation">
                  <h3>All Files ({files.length})</h3>
                  <div className="file-grid">
                    {files.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFileClick(idx)}
                        className={`file-grid-item ${idx === selectedFileIdx ? 'active' : ''}`}
                      >
                        <div className="file-preview">
                          {url.endsWith('.pdf') ? (
                            <iframe
                              src={url}
                              title={`${fileLabel} PDF ${idx + 1}`}
                              className="grid-pdf-viewer"
                            />
                          ) : (
                            <img
                              src={url || '/placeholder.svg'}
                              alt={`${fileLabel} File ${idx + 1}`}
                              className="grid-image-viewer"
                            />
                          )}
                        </div>
                        <div className="file-grid-info">
                          <span className="file-icon">{getFileIcon(url)}</span>
                          <div className="file-details">
                            <span className="file-name">
                              {fileLabel} {idx + 1}
                            </span>
                            <span className="file-type">{getFileTypeBadge(url).label}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* Enhanced Side by Side View */
          <div className="side-by-side-view">
            {/* Exercise Files Column */}
            <div className="column exercise-column">
              <div className="column-header">
                <div className="column-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  <h2>Exercise Files</h2>
                </div>
                <span className="file-count">{exerciseFiles.length}</span>
              </div>
              <div className="column-content">
                {exerciseFiles.length === 0 ? (
                  <div className="empty-state">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <p>No exercise files available</p>
                  </div>
                ) : (
                  <div className="files-grid">
                    {exerciseFiles.map((url, idx) => {
                      const badge = getFileTypeBadge(url)
                      return (
                        <div key={idx} className="file-card">
                          <div className="file-card-header">
                            <div className="file-info">
                              <span className="file-number">File {idx + 1}</span>
                              <span className={`file-badge ${badge.type}`}>{badge.label}</span>
                            </div>
                          </div>
                          <div className="file-card-content">
                            {url.endsWith('.pdf') ? (
                              <iframe
                                src={url}
                                title={`Exercise PDF ${idx + 1}`}
                                className="card-viewer"
                              />
                            ) : (
                              <img
                                src={url || '/placeholder.svg'}
                                alt={`Exercise File ${idx + 1}`}
                                className="card-viewer"
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Solution Files Column */}
            <div className="column solution-column">
              <div className="column-header">
                <div className="column-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22,4 12,14.01 9,11.01" />
                  </svg>
                  <h2>Solutions</h2>
                </div>
                <span className="file-count">{correctionFiles.length}</span>
              </div>
              <div className="column-content">
                {correctionFiles.length === 0 ? (
                  <div className="empty-state">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <p>No solution files available</p>
                  </div>
                ) : (
                  <div className="files-grid">
                    {correctionFiles.map((url, idx) => {
                      const badge = getFileTypeBadge(url)
                      return (
                        <div key={idx} className="file-card">
                          <div className="file-card-header">
                            <div className="file-info">
                              <span className="file-number">Solution {idx + 1}</span>
                              <span className={`file-badge ${badge.type}`}>{badge.label}</span>
                            </div>
                          </div>
                          <div className="file-card-content">
                            {url.endsWith('.pdf') ? (
                              <iframe
                                src={url}
                                title={`Solution PDF ${idx + 1}`}
                                className="card-viewer"
                              />
                            ) : (
                              <img
                                src={url || '/placeholder.svg'}
                                alt={`Solution File ${idx + 1}`}
                                className="card-viewer"
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExerciseViewer
