'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { IoArrowBack, IoDocumentText, IoCheckmarkCircle } from 'react-icons/io5'
import { getSecureExerciseFiles, getSecureFileUrl } from '@/lib/api/exercises'
import { supabase } from '@/lib/supabase'
import { ExerciseViewerProps, Exercise } from './types'

import './ExerciseViewer.scss'

const ExerciseViewer: React.FC<ExerciseViewerProps> = ({ exercise, onBack, exerciseIndex }) => {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'exercise' | 'solution'>('exercise')
  
  // Determine if current language is RTL
  const isRTL = i18n.language === 'ar'
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [secureExerciseFiles, setSecureExerciseFiles] = useState<string[]>([])
  const [secureCorrectionFiles, setSecureCorrectionFiles] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const preloadedFiles = useRef(new Set<string>())

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

  // Preload adjacent files for faster switching
  useEffect(() => {
    if (!hasAccess || loadingFiles) return
    
    const currentFiles = getCurrentFiles()
    if (currentFiles.length === 0) return
    
    // Preload current file if not already loaded
    const currentFile = currentFiles[selectedFileIdx]
    if (currentFile) {
      // Preload logic can be added here if needed
    }
    
    // Preload next and previous files
    const nextIdx = selectedFileIdx + 1
    const prevIdx = selectedFileIdx - 1
    
    if (nextIdx < currentFiles.length) {
      // Preload next file
    }
    if (prevIdx >= 0) {
      // Preload previous file
    }
    
    // Preload files from the other tab (exercise/solution)
    const otherFiles = activeTab === 'exercise' ? secureCorrectionFiles : secureExerciseFiles
    if (otherFiles.length > 0 && selectedFileIdx < otherFiles.length) {
      // Preload other tab file
    }
  }, [selectedFileIdx, activeTab, hasAccess, loadingFiles, secureExerciseFiles, secureCorrectionFiles])

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
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading exercise files...</p>
        </div>
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
              <IoDocumentText style={{ strokeWidth: '2.5px' }} />
              <span>{t('exerciseViewer.exerciseTab')}</span>
            </div>
            <div 
              className={`tab-btn-header ${activeTab === 'solution' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('solution')
                setSelectedFileIdx(0)
              }}
            >
              <IoCheckmarkCircle style={{ strokeWidth: '2.5px' }} />
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

        {/* Main PDF Viewer - Full Width with Download Protection */}
        <div className="custom-pdf-viewer full-width">
          {getCurrentPDFUrl() ? (
            <div 
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: 'white',
                overflow: 'hidden'
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                // Block common download/save shortcuts
                if (
                  (e.ctrlKey && (e.key === 's' || e.key === 'd' || e.key === 'p' || e.key === 'u')) ||
                  (e.metaKey && (e.key === 's' || e.key === 'd' || e.key === 'p')) ||
                        e.key === 'F12' ||
                  (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
                  (e.ctrlKey && e.key === 'u') ||
                  (e.ctrlKey && e.shiftKey && e.key === 'i')
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                }
              }}
            >
              {/* Custom PDF Viewer with embedded PDF.js */}
              <iframe
                src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(getCurrentPDFUrl()!)}&zoom=page-fit&pagemode=none`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'white',
                  pointerEvents: 'auto'
                }}
                title="PDF Viewer"
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={() => {
                  console.log('PDF viewer loaded with download protection');
                }}
              />
              
              {/* Overlay to prevent direct interaction with PDF content */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              />
            </div>
          ) : (
            // Test mode: Show sample PDF when no files are available
            <div 
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: 'white',
                overflow: 'hidden'
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                // Block common download/save shortcuts
                if (
                  (e.ctrlKey && (e.key === 's' || e.key === 'd' || e.key === 'p' || e.key === 'u')) ||
                  (e.metaKey && (e.key === 's' || e.key === 'd' || e.key === 'p')) ||
                        e.key === 'F12' ||
                  (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
                  (e.ctrlKey && e.key === 'u') ||
                  (e.ctrlKey && e.shiftKey && e.key === 'i')
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                }
              }}
            >
              <iframe
                src="https://mozilla.github.io/pdf.js/web/viewer.html?file=https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf&zoom=page-fit&pagemode=none"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'white',
                  pointerEvents: 'auto'
                }}
                title="PDF Viewer"
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={() => {
                  console.log('Test PDF viewer loaded with download protection');
                }}
              />
              
              {/* Overlay to prevent direct interaction with PDF content */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExerciseViewer
