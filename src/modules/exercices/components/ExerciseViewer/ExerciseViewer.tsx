'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import './ExerciseViewer.scss'
import type { Exercise } from '../../types/exercise'
import { getSecureExerciseFiles, getSecureFileUrl } from '@/lib/api/exercises'

interface ExerciseViewerProps {
  exercise: Exercise
  onClose: () => void
  exerciseIndex?: number // Add exercise index for temporary fix
}

const validUrl = (url: string) => url && url !== 'string'

const ExerciseViewer: React.FC<ExerciseViewerProps> = ({ exercise, onClose, exerciseIndex }) => {
  const { t } = useTranslation('translation')
  const [activeTab, setActiveTab] = useState<'exercise' | 'correction'>('exercise')
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Secure file state
  const [secureExerciseFiles, setSecureExerciseFiles] = useState<string[]>([])
  const [secureCorrectionFiles, setSecureCorrectionFiles] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [fileError, setFileError] = useState<string | null>(null)

  // Load secure files when component mounts
  useEffect(() => {
    const loadSecureFiles = async () => {
      try {
        setLoadingFiles(true)
        setFileError(null)
        
        const secureFiles = await getSecureExerciseFiles(exercise.id, exerciseIndex)
        
        if (secureFiles.hasAccess) {
          setSecureExerciseFiles(secureFiles.exerciseFiles.filter(validUrl))
          setSecureCorrectionFiles(secureFiles.correctionFiles.filter(validUrl))
          setHasAccess(true)
        } else {
          setHasAccess(false)
          setFileError('Access denied: Premium content requires active subscription')
        }
      } catch (error) {
        console.error('Error loading secure files:', error)
        setFileError('Failed to load exercise files')
        setHasAccess(false)
      } finally {
        setLoadingFiles(false)
      }
    }

    loadSecureFiles()
  }, [exercise.id, exerciseIndex])

  // Get current files based on active tab
  const files = activeTab === 'exercise' ? secureExerciseFiles : secureCorrectionFiles
  const fileLabel = activeTab === 'exercise' ? 'Exercise' : 'Solution'

  const handleTabClick = (tab: 'exercise' | 'correction') => {
    setActiveTab(tab)
    setSelectedFileIdx(0)
  }

  const handleFileClick = (idx: number) => {
    setSelectedFileIdx(idx)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleClose = () => {
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

  const getFileTypeBadge = (url: string) => {
    if (url.endsWith('.pdf')) return 'PDF'
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'Image'
    if (url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) return 'Video'
    return 'File'
  }

  const getFileIcon = (url: string) => {
    if (url.endsWith('.pdf')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
      )
    }
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      )
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13,2 13,9 20,9" />
      </svg>
    )
  }

  if (loadingFiles) {
    return (
      <div className="exercise-viewer">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (fileError) {
    return (
      <div className="exercise-viewer">
        <div className="access-denied-container">
          <h3>Access Denied</h3>
          <p>{fileError}</p>
          <button onClick={handleClose} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Exercises
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`exercise-viewer ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Modern Header with Exercise Info and Navigation */}
      {!isFullscreen && (
        <div className="modern-header">
          <div className="header-compact">
            <div className="header-left">
              <button onClick={handleClose} className="back-btn-modern">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Exercises
              </button>
              
              <div className="exercise-info-compact">
                <h1 className="exercise-title-compact">{exercise.name}</h1>
                <span className="level-badge-compact">Niveau: Avancé</span>
              </div>
            </div>
            
            <div className="tab-switcher-modern">
              <button
                className={`tab-btn-modern ${activeTab === 'exercise' ? 'active' : ''}`}
                onClick={() => handleTabClick('exercise')}
                title="View Exercise Files"
                aria-label="Switch to exercise files"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                <span>Exercise</span>
              </button>
              
              <button
                className={`tab-btn-modern ${activeTab === 'correction' ? 'active' : ''}`}
                onClick={() => handleTabClick('correction')}
                title="View Solution Files"
                aria-label="Switch to solution files"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
                <span>Solution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Controls - Only visible in fullscreen */}
      {isFullscreen && (
        <div className="fullscreen-controls">
          <div className="fullscreen-header">
            <div className="fullscreen-info">
              <span className="file-name">{fileLabel} {selectedFileIdx + 1}</span>
              <span className="file-type">{getFileTypeBadge(files[selectedFileIdx])}</span>
            </div>
            <div className="fullscreen-actions">
              <button onClick={toggleFullscreen} className="exit-fullscreen-btn" title="Exit Fullscreen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              </button>
              <button onClick={handleClose} className="close-btn" title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Modern Card Layout */}
      <div className="viewer-content-modern">
        {files.length > 0 ? (
          <div className="content-card">
            <div className="file-viewer-modern">
              {files[selectedFileIdx].endsWith('.pdf') ? (
                <div className="pdf-container-modern">
                  <iframe
                    src={files[selectedFileIdx]}
                    className="pdf-viewer-modern"
                    title={`${fileLabel} ${selectedFileIdx + 1}`}
                    width="100%"
                    height="100%"
                  />
                  {!isFullscreen && (
                    <button 
                      onClick={toggleFullscreen} 
                      className="fullscreen-btn-modern" 
                      title="Enter Fullscreen"
                      aria-label="Enter fullscreen mode"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : files[selectedFileIdx].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={files[selectedFileIdx]}
                  className="image-viewer-modern"
                  alt={`${fileLabel} ${selectedFileIdx + 1}`}
                />
              ) : (
                <div className="unsupported-file-modern">
                  <div className="unsupported-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                    <h3>File Type Not Supported</h3>
                    <p>This file type cannot be previewed in the browser.</p>
                    <a href={files[selectedFileIdx]} target="_blank" rel="noopener noreferrer" className="download-link-modern">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-files-modern">
            <div className="no-files-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              <h3>No Files Available</h3>
              <p>No {fileLabel.toLowerCase()} files are available for this exercise.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExerciseViewer
