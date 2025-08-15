'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { IoArrowBack, IoDocumentText, IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { getSecureExerciseFiles, getSecureFileUrl } from '@/lib/api/exercises'
import './ExerciseViewer.scss'

interface ExerciseViewerProps {
  exercise: {
    id: string
    code?: string
    name: string
    tag: number
    exerciseFileUrls?: string[]
    correctionFileUrls?: string[]
  }
  onBack: () => void
  exerciseIndex?: number
}

const ExerciseViewer: React.FC<ExerciseViewerProps> = ({ exercise, onBack, exerciseIndex }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'exercise' | 'solution'>('exercise')
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secureExerciseFiles, setSecureExerciseFiles] = useState<string[]>([])
  const [secureCorrectionFiles, setSecureCorrectionFiles] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    if (activeTab === 'exercise') {
      return secureExerciseFiles
    } else {
      return secureCorrectionFiles
    }
  }

  const files = getCurrentFiles()
  
  console.log('Current files for tab:', activeTab, 'Files:', files)
  console.log('Selected file index:', selectedFileIdx)
  console.log('Has access:', hasAccess)

  // Load PDF using pdfjs-dist
  useEffect(() => {
    const loadPDF = async () => {
      if (!files[selectedFileIdx]) {
        console.log('No file at index:', selectedFileIdx, 'Files:', files)
        setError('No PDF file available')
        return
      }

      const fileUrl = files[selectedFileIdx]
      console.log('Loading PDF from URL:', fileUrl)

      try {
        setLoading(true)
        setError(null)
        
        // Get signed URL for Supabase storage files
        let finalUrl = fileUrl
        if (fileUrl.includes('supabase.co')) {
          console.log('Getting signed URL for Supabase file...')
          const signedUrl = await getSecureFileUrl(fileUrl, exercise.id)
          if (signedUrl) {
            finalUrl = signedUrl
            console.log('Using signed URL:', signedUrl)
          } else {
            throw new Error('Failed to get signed URL for file')
          }
        }
        
        // Dynamically import pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        
        console.log('PDF.js loaded, creating loading task...')
        const loadingTask = pdfjsLib.getDocument(finalUrl)
        
        console.log('Loading task created, waiting for promise...')
        const pdf = await loadingTask.promise
        
        console.log('PDF loaded successfully, pages:', pdf.numPages)
        setPdfDocument(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
      } catch (error: any) {
        console.error('Error loading PDF:', error)
        setError(`Failed to load PDF: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (hasAccess && files.length > 0) {
      console.log('Starting PDF load - hasAccess:', hasAccess, 'files.length:', files.length)
      loadPDF()
    } else {
      console.log('Not loading PDF - hasAccess:', hasAccess, 'files.length:', files.length)
    }
  }, [selectedFileIdx, files, hasAccess, exercise.id])

  // Render PDF page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return

      try {
        const page = await pdfDocument.getPage(currentPage)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        const viewport = page.getViewport({ scale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        await page.render(renderContext).promise
      } catch (error) {
        console.error('Error rendering PDF page:', error)
      }
    }

    renderPage()
  }, [pdfDocument, currentPage, scale])

  const handleNextFile = () => {
    if (selectedFileIdx < files.length - 1) {
      setSelectedFileIdx(selectedFileIdx + 1)
    }
  }

  const handlePrevFile = () => {
    if (selectedFileIdx > 0) {
      setSelectedFileIdx(selectedFileIdx - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const getDifficultyColor = (difficulty: string | number) => {
    // Convert to string and handle both string and number inputs
    const difficultyStr = String(difficulty).toLowerCase()
    
    switch (difficultyStr) {
      case 'easy':
      case '0':
        return '#10b981'
      case 'medium':
      case '1':
        return '#f59e0b'
      case 'hard':
      case '2':
        return '#ef4444'
      case 'expert':
      case '3':
        return '#8b5cf6'
      default:
        return '#6b7280'
    }
  }

  const getDifficultyText = (difficulty: string | number) => {
    // Convert to string and handle both string and number inputs
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
        return 'EXPERT'
      default:
        return 'UNKNOWN'
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
          <button onClick={onBack} className="back-btn-modern">
            <IoArrowBack />
            {t('exercises.backToExercises')}
          </button>
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
        <button className="back-btn-modern" onClick={onBack}>
          <IoArrowBack />
          <span>{t('exercises.backToExercises')}</span>
        </button>
        
        <div className="header-center">
          <span className="exercise-code">{exercise.code || exercise.name}</span>
          <div 
            className="difficulty-tag"
            style={{ backgroundColor: getDifficultyColor(exercise.tag) }}
          >
            {getDifficultyText(exercise.tag)}
          </div>
        </div>
        
        <button 
          className={`solution-btn ${activeTab === 'solution' ? 'active' : ''}`}
          onClick={() => setActiveTab('solution')}
        >
          {t('exercises.solution')}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="tab-switcher-modern">
        <button 
          className={`tab-btn-modern ${activeTab === 'exercise' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('exercise')
            setSelectedFileIdx(0)
          }}
        >
          <IoDocumentText />
          <span>{t('exercises.exercise')}</span>
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'solution' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('solution')
            setSelectedFileIdx(0)
          }}
        >
          <IoDocumentText />
          <span>{t('exercises.solution')}</span>
        </button>
      </div>

      {/* Content */}
      <div className="content-card">
        {/* File Navigation */}
        {files.length > 1 && (
          <div className="file-navigation">
            <button 
              className="nav-btn" 
              onClick={handlePrevFile}
              disabled={selectedFileIdx === 0}
            >
              <IoChevronBack />
            </button>
            <div className="file-indicator">
              <span className="file-counter">
                {selectedFileIdx + 1} / {files.length}
              </span>
              <span className="file-label">{getFileName(files[selectedFileIdx])}</span>
            </div>
            <button 
              className="nav-btn" 
              onClick={handleNextFile}
              disabled={selectedFileIdx === files.length - 1}
            >
              <IoChevronForward />
            </button>
          </div>
        )}

        {/* File Gallery */}
        {files.length > 0 && (
          <div className="file-gallery">
            <div className="gallery-header">
              <span>{t('exercises.files')} ({files.length})</span>
            </div>
            <div className="gallery-grid">
              {files.map((fileUrl, index) => (
                <div 
                  key={index}
                  className={`file-card ${selectedFileIdx === index ? 'active' : ''}`}
                  onClick={() => setSelectedFileIdx(index)}
                >
                  <div className="file-icon">{getFileIcon(fileUrl)}</div>
                  <div className="file-info">
                    <span className="file-name">{getFileName(fileUrl)}</span>
                    <span className="file-type">{getFileType(fileUrl)}</span>
                  </div>
                  {selectedFileIdx === index && (
                    <div className="active-indicator"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="debug-info" style={{padding: '0.5rem', fontSize: '0.8rem', color: '#666'}}>
              Debug: {files.length} files loaded for {activeTab} tab
            </div>
          </div>
        )}

        {/* Custom PDF Viewer */}
        <div className="custom-pdf-viewer">
          {loading ? (
            <div className="loading-pdf">
              <div className="loading-spinner"></div>
              <span>{t('exercises.loadingPDF')}</span>
            </div>
          ) : error ? (
            <div className="error-pdf">
              <div className="error-icon">⚠️</div>
              <span className="error-message">{error}</span>
              <button 
                className="retry-btn"
                onClick={() => {
                  setError(null)
                  setPdfDocument(null)
                }}
              >
                Retry
              </button>
            </div>
          ) : pdfDocument ? (
            <>
              {/* PDF Controls */}
              <div className="pdf-controls">
                <div className="page-controls">
                  <button 
                    className="control-btn"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                  >
                    <IoChevronBack />
                  </button>
                  <span className="page-info">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    className="control-btn"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    <IoChevronForward />
                  </button>
                </div>
                
                <div className="zoom-controls">
                  <button 
                    className="control-btn"
                    onClick={handleZoomOut}
                    disabled={scale <= 0.5}
                  >
                    -
                  </button>
                  <span className="zoom-level">{Math.round(scale * 100)}%</span>
                  <button 
                    className="control-btn"
                    onClick={handleZoomIn}
                    disabled={scale >= 3.0}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* PDF Canvas */}
              <div className="pdf-canvas-container">
                <canvas 
                  ref={canvasRef}
                  className="pdf-canvas"
                />
              </div>
            </>
          ) : (
            <div className="no-pdf">
              <div className="no-pdf-icon">📄</div>
              <span>No PDF file available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExerciseViewer
