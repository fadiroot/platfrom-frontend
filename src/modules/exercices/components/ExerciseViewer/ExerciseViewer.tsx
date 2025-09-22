'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { IoArrowBack, IoBookOutline, IoShieldCheckmarkOutline } from 'react-icons/io5'
import { getSecureExerciseFiles, getSecureFileUrl } from '@/lib/api/exercises'
import { supabase } from '@/lib/supabase'
import { ExerciseViewerProps, Exercise } from './types'
import Loader from '../../../shared/components/Loader/Loader'

import './ExerciseViewer.scss'

const ExerciseViewer: React.FC<ExerciseViewerProps> = ({ exercise, onBack, exerciseIndex }) => {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'exercise' | 'solution'>('exercise')
  
  // Always use LTR direction for all languages
  const isRTL = false
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [secureExerciseFiles, setSecureExerciseFiles] = useState<string[]>([])
  const [secureCorrectionFiles, setSecureCorrectionFiles] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const preloadedFiles = useRef(new Set<string>())
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const correctionIframeRef = useRef<HTMLIFrameElement>(null)
  const [preloadedTabs, setPreloadedTabs] = useState<Set<string>>(new Set())

  // Preload PDFs for better performance


  // Load secure files when component mounts
  useEffect(() => {
    const loadSecureFiles = async () => {
      try {
        setLoadingFiles(true)
        setError(null)
        
        console.log('Loading secure files for exercise:', exercise.id, 'index:', exerciseIndex)
        
        const secureFiles = await getSecureExerciseFiles(exercise.id, exerciseIndex)
        
        console.log('Secure files result:', secureFiles)
        
        if (secureFiles.hasAccess) {
          console.log('Setting exercise files:', secureFiles.exerciseFiles)
          console.log('Setting correction files:', secureFiles.correctionFiles)
          setSecureExerciseFiles(secureFiles.exerciseFiles)
          setSecureCorrectionFiles(secureFiles.correctionFiles)
          setHasAccess(true)
        } else {
          console.log('Access denied for exercise:', exercise.id)
          setHasAccess(false)
          setError('Access denied: Premium content requires active subscription')
        }
      } catch (error) {
        console.error('Error loading secure files:', error)
        setError('Failed to load exercise files')
        setHasAccess(false)
      } finally {
        setLoadingFiles(false)
      }
    }

    loadSecureFiles()
  }, [exercise.id, exerciseIndex])

  // Preload both tabs for instant switching
  useEffect(() => {
    if (!hasAccess || loadingFiles) return
    
    const exerciseFiles = secureExerciseFiles
    const correctionFiles = secureCorrectionFiles
    
    // Preload both exercise and correction files
    const preloadTab = (files: string[], tabName: string) => {
      if (files.length > 0 && selectedFileIdx < files.length) {
        const fileUrl = files[selectedFileIdx]
        if (fileUrl && !preloadedTabs.has(`${tabName}-${selectedFileIdx}`)) {
          // Mark as preloaded
          setPreloadedTabs(prev => new Set([...prev, `${tabName}-${selectedFileIdx}`]))
        }
      }
    }
    
    // Preload current file index for both tabs
    preloadTab(exerciseFiles, 'exercise')
    preloadTab(correctionFiles, 'correction')
    
  }, [selectedFileIdx, hasAccess, loadingFiles, secureExerciseFiles, secureCorrectionFiles, preloadedTabs])

  // Update iframe sources when file index changes
  useEffect(() => {
    if (!hasAccess || loadingFiles) return

    // Update exercise iframe
    if (iframeRef.current && secureExerciseFiles.length > 0 && selectedFileIdx < secureExerciseFiles.length) {
      const exerciseUrl = secureExerciseFiles[selectedFileIdx]
      const newSrc = `https://docs.google.com/gview?url=${encodeURIComponent(exerciseUrl)}&embedded=true&rm=minimal`
      if (iframeRef.current.src !== newSrc) {
        iframeRef.current.src = newSrc
      }
    }

    // Update correction iframe
    if (correctionIframeRef.current && secureCorrectionFiles.length > 0 && selectedFileIdx < secureCorrectionFiles.length) {
      const correctionUrl = secureCorrectionFiles[selectedFileIdx]
      const newSrc = `https://docs.google.com/gview?url=${encodeURIComponent(correctionUrl)}&embedded=true&rm=minimal`
      if (correctionIframeRef.current.src !== newSrc) {
        correctionIframeRef.current.src = newSrc
      }
    }
  }, [selectedFileIdx, secureExerciseFiles, secureCorrectionFiles, hasAccess, loadingFiles])

  // Get current files based on active tab
  const getCurrentFiles = () => {
    return activeTab === 'exercise' ? secureExerciseFiles : secureCorrectionFiles
  }

  // Get current PDF URL
  const getCurrentPDFUrl = () => {
    const currentFiles = getCurrentFiles()
    if (currentFiles.length === 0) return null
    if (selectedFileIdx >= currentFiles.length) return currentFiles[0]
    return currentFiles[selectedFileIdx]
  }

  // Get difficulty text
  const getDifficultyText = (difficulty: string | number) => {
    const difficultyStr = String(difficulty).toLowerCase()
    switch (difficultyStr) {
      case 'easy':
      case '0':
        return t('exercises.difficulty.easy')
      case 'medium':
      case '1':
        return t('exercises.difficulty.medium')
      case 'hard':
      case '2':
        return t('exercises.difficulty.hard')
      case 'expert':
      case '3':
        return t('exercises.difficulty.expert')
      default:
        return t('exercises.difficulty.easy')
    }
  }

  // Get difficulty class
  const getDifficultyClass = (difficulty: string | number) => {
    const difficultyStr = String(difficulty).toLowerCase()
    switch (difficultyStr) {
      case 'easy':
      case '0':
        return 'difficulty-easy'
      case 'medium':
      case '1':
        return 'difficulty-medium'
      case 'hard':
      case '2':
        return 'difficulty-hard'
      case 'expert':
      case '3':
        return 'difficulty-expert'
      default:
        return 'difficulty-easy'
    }
  }

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️'
      default:
        return '📄'
    }
  }

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Unknown File'
  }

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toUpperCase() || 'PDF'
    return extension
  }


  if (loadingFiles) {
    return (
      <div className="exercise-viewer-modern">
        <Loader 
          size="large" 
          color="primary" 
          context="exercise"
          fullScreen={true}
        />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="exercise-viewer-modern">
        <div className="access-denied-container">
          <h3>Access Denied</h3>
          <p>{error}</p>
          <button onClick={onBack} className="back-btn-modern">
            <IoArrowBack />
            {t('exercises.backToExercises')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="exercise-viewer-modern">
      {/* Header */}
      <div className="header-modern">
        <div className="header-left">
        <button className="back-btn-modern" onClick={onBack}>
          <IoArrowBack onClick={onBack} />
          <span>{t('exercises.backToExercises')}</span>
        </button>
        </div>
        
        <div className="header-center">
          <div className="exercise-info">
            <div className="exercise-code">{exercise.code || exercise.name}</div>
            <div className="exercise-meta">
            </div>
            <div className={`difficulty-badge ${getDifficultyClass(exercise.difficulty)}`}>
              <span>{getDifficultyText(exercise.difficulty)}</span>
            </div>
            </div>
          </div>
          
        <div className="header-right">
          {/* Tab Switcher in Header */}
          <div 
            className={`tab-switcher-header ${activeTab === 'exercise' ? 'exercise-active' : 'solution-active'} ${isRTL ? 'rtl' : 'ltr'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div 
              className={`tab-btn-header ${activeTab === 'exercise' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('exercise')
                setSelectedFileIdx(0)
              }}
            >
              <IoBookOutline style={{ strokeWidth: '2.5px' }} />
              <span>{t('exerciseViewer.exerciseTab')}</span>
            </div>
            <div 
              className={`tab-btn-header ${activeTab === 'solution' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('solution')
                setSelectedFileIdx(0)
              }}
            >
              <IoShieldCheckmarkOutline style={{ strokeWidth: '2.5px' }} />
              <span>{t('exerciseViewer.correctionTab')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content-card full-height">


        {/* File Information - Minimal style like PDF.js */}
        {getCurrentFiles().length > 1 && (
          <div style={{ 
            padding: '8px 12px', 
            background: '#474747', 
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#e8e8e8'
          }}>
            <div>
              <span>{getFileName(getCurrentFiles()[selectedFileIdx])}</span>
              <span style={{ marginLeft: '8px', color: '#999' }}>
                ({selectedFileIdx + 1} of {getCurrentFiles().length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {getCurrentFiles().map((file, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFileIdx(index)}
                  style={{
                    padding: '2px 6px',
                    background: selectedFileIdx === index ? '#007acc' : 'transparent',
                    color: selectedFileIdx === index ? 'white' : '#e8e8e8',
                    border: '1px solid #666',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    minWidth: '20px'
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Fast PDF Viewer */}
        <div className="modern-pdf-viewer">
          {getCurrentPDFUrl() ? (
            <div className="pdf-viewer-container">
              {/* Main PDF Content */}
              <div 
                className="pdf-content-area"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  // Block all dangerous keyboard shortcuts
                  if (
                    // Save, Download, Print, View Source
                    (e.ctrlKey && (e.key === 's' || e.key === 'd' || e.key === 'p' || e.key === 'u')) ||
                    (e.metaKey && (e.key === 's' || e.key === 'd' || e.key === 'p' || e.key === 'u')) ||
                    // Developer tools
                    e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
                    (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
                    // New window/tab
                    (e.ctrlKey && (e.key === 'n' || e.key === 't')) ||
                    (e.metaKey && (e.key === 'n' || e.key === 't')) ||
                    // Refresh
                    (e.key === 'F5') ||
                    (e.ctrlKey && e.key === 'r') ||
                    (e.metaKey && e.key === 'r')
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }}
                tabIndex={0}
              >
                {/* Dual Iframe System for Fast Tab Switching */}
                <div className="secure-pdf-container">
                  {/* Exercise Tab Iframe */}
                  <iframe
                    ref={iframeRef}
                    src={secureExerciseFiles.length > 0 && selectedFileIdx < secureExerciseFiles.length ? 
                      `https://docs.google.com/gview?url=${encodeURIComponent(secureExerciseFiles[selectedFileIdx])}&embedded=true&rm=minimal` : 
                      ''}
                    className={`fast-pdf-iframe ${activeTab === 'exercise' ? 'active' : 'hidden'}`}
                    title="Exercise PDF Viewer"
                    loading="eager"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={(e) => {
                      const iframe = e.currentTarget;
                      // Hide loading indicator when active tab loads
                      if (activeTab === 'exercise') {
                        const loader = document.querySelector('.pdf-loading-indicator');
                        if (loader) loader.remove();
                      }
                      
                      // Inject security CSS
                      try {
                        if (iframe.contentDocument) {
                          const style = iframe.contentDocument.createElement('style');
                          style.textContent = `
                            .ndfHFb-c4YZDc-Wrql6b, 
                            .ndfHFb-c4YZDc-to915-LgbsSe,
                            .ndfHFb-c4YZDc-LgbsSe,
                            [data-tooltip="Open in new window"],
                            [aria-label="Open in new window"],
                            [title="Open in new window"],
                            .ndfHFb-c4YZDc-Wrql6b-LgbsSe-OWXEXe-IT5dJd,
                            .docs-icon-acrobat,
                            .docs-icon-download,
                            .docs-icon-print {
                              display: none !important;
                              visibility: hidden !important;
                            }
                            body {
                              -webkit-user-select: none;
                              -moz-user-select: none;
                              -ms-user-select: none;
                              user-select: none;
                            }
                          `;
                          iframe.contentDocument.head.appendChild(style);
                        }
                      } catch (error) {
                        console.log('Cannot inject styles due to CORS policy');
                      }
                    }}
                  />

                  {/* Correction Tab Iframe */}
                  <iframe
                    ref={correctionIframeRef}
                    src={secureCorrectionFiles.length > 0 && selectedFileIdx < secureCorrectionFiles.length ? 
                      `https://docs.google.com/gview?url=${encodeURIComponent(secureCorrectionFiles[selectedFileIdx])}&embedded=true&rm=minimal` : 
                      ''}
                    className={`fast-pdf-iframe ${activeTab === 'solution' ? 'active' : 'hidden'}`}
                    title="Solution PDF Viewer"
                    loading="eager"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={(e) => {
                      const iframe = e.currentTarget;
                      // Hide loading indicator when active tab loads
                      if (activeTab === 'solution') {
                        const loader = document.querySelector('.pdf-loading-indicator');
                        if (loader) loader.remove();
                      }
                      
                      // Inject security CSS
                      try {
                        if (iframe.contentDocument) {
                          const style = iframe.contentDocument.createElement('style');
                          style.textContent = `
                            .ndfHFb-c4YZDc-Wrql6b, 
                            .ndfHFb-c4YZDc-to915-LgbsSe,
                            .ndfHFb-c4YZDc-LgbsSe,
                            [data-tooltip="Open in new window"],
                            [aria-label="Open in new window"],
                            [title="Open in new window"],
                            .ndfHFb-c4YZDc-Wrql6b-LgbsSe-OWXEXe-IT5dJd,
                            .docs-icon-acrobat,
                            .docs-icon-download,
                            .docs-icon-print {
                              display: none !important;
                              visibility: hidden !important;
                            }
                            body {
                              -webkit-user-select: none;
                              -moz-user-select: none;
                              -ms-user-select: none;
                              user-select: none;
                            }
                          `;
                          iframe.contentDocument.head.appendChild(style);
                        }
                      } catch (error) {
                        console.log('Cannot inject styles due to CORS policy');
                      }
                    }}
                  />
                  
                  {/* Security Overlay - Prevents Right Click and Selection */}
                  <div 
                    className="security-overlay"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    onMouseDown={(e) => {
                      // Prevent middle mouse button (open in new tab)
                      if (e.button === 1) {
                        e.preventDefault();
                      }
                    }}
                  ></div>
                </div>
                
                {/* Loading Indicator */}
                <div className="pdf-loading-indicator">
                  <div className="loading-spinner"></div>
                  <span>Loading document...</span>
                </div>

                {/* Protection Layer */}
                <div className="pdf-protection-layer"></div>
              </div>

              {/* Performance Status */}
              <div className="viewer-footer">
                <div className="performance-indicator">
                  <div className="speed-indicator">
                    <span className="speed-dot"></span>
                    <span>Fast Mode</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-document-state">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Document Available</h3>
                <p>This exercise doesn't have a PDF document attached.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExerciseViewer
