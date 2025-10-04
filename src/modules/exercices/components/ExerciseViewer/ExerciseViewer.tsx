'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { IoArrowBack, IoBookOutline, IoShieldCheckmarkOutline } from 'react-icons/io5'
import { getSecureExerciseFiles } from '@/lib/api/exercises'
import { ExerciseViewerProps, Exercise } from './types'
import Loader from '../../../shared/components/Loader/Loader'

import './ExerciseViewer.scss'

const ExerciseViewer: React.FC<ExerciseViewerProps> = ({ exercise, onBack, exerciseIndex }) => {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'exercise' | 'solution'>('exercise')
  
  // Add Arabic font class and RTL direction when Arabic language is selected
  const isArabic = i18n?.language === 'ar';
  const isRTL = isArabic;
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [secureExerciseFiles, setSecureExerciseFiles] = useState<string[]>([])
  const [secureCorrectionFiles, setSecureCorrectionFiles] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
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
    <div 
      className={`exercise-viewer-modern ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="header-modern">
        <div className="header-left">
          {/* Conditionally render based on language */}
          {isRTL ? (
            // Arabic: Tab switcher on left
            <div 
              className={`tab-switcher-header ${activeTab === 'exercise' ? 'exercise-active' : 'solution-active'} ${isRTL ? 'rtl' : 'ltr'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div 
                className={`tab-btn-header ${activeTab === 'exercise' ? 'active' : ''}`}
                onClick={() => setActiveTab('exercise')}
              >
                <IoBookOutline style={{ strokeWidth: '2.5px' }} />
                <span>{t('exerciseViewer.exerciseTab')}</span>
              </div>
              <div 
                className={`tab-btn-header ${activeTab === 'solution' ? 'active' : ''}`}
                onClick={() => setActiveTab('solution')}
              >
                <IoShieldCheckmarkOutline style={{ strokeWidth: '2.5px' }} />
                <span>{t('exerciseViewer.correctionTab')}</span>
              </div>
            </div>
          ) : (
            // LTR: Back button on left
            <button className="back-btn-modern" onClick={onBack}>
              <IoArrowBack onClick={onBack} />
              <span>{t('exercises.backToExercises')}</span>
            </button>
          )}
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
          {/* Conditionally render based on language */}
          {isRTL ? (
            // Arabic: Back button on right
            <button className="back-btn-modern" onClick={onBack}>
              <IoArrowBack onClick={onBack} />
              <span>{t('exercises.backToExercises')}</span>
            </button>
          ) : (
            // LTR: Tab switcher on right
            <div 
              className={`tab-switcher-header ${activeTab === 'exercise' ? 'exercise-active' : 'solution-active'} ${isRTL ? 'rtl' : 'ltr'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div 
                className={`tab-btn-header ${activeTab === 'exercise' ? 'active' : ''}`}
                onClick={() => setActiveTab('exercise')}
              >
                <IoBookOutline style={{ strokeWidth: '2.5px' }} />
                <span>{t('exerciseViewer.exerciseTab')}</span>
              </div>
              <div 
                className={`tab-btn-header ${activeTab === 'solution' ? 'active' : ''}`}
                onClick={() => setActiveTab('solution')}
              >
                <IoShieldCheckmarkOutline style={{ strokeWidth: '2.5px' }} />
                <span>{t('exerciseViewer.correctionTab')}</span>
              </div>
            </div>
          )}
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

        {/* Direct Google PDF Viewer */}
        <div className="modern-pdf-viewer">
          {getCurrentPDFUrl() ? (
            <iframe
              src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(getCurrentPDFUrl()!)}`}
              width="100%"
              height="100%"
              frameBorder="0"
              title={isRTL ? 'عارض PDF' : 'PDF Viewer'}
              className="pdf-iframe"
              allowFullScreen
              style={{ border: 'none' }}
              sandbox="allow-same-origin allow-scripts allow-forms"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
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
