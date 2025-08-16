import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Loader from '../../../shared/components/Loader/Loader';
import './SecurePDFViewer.scss';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SecurePDFViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ url, onLoad, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!mounted) return;

        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        // Render the first page
        await renderPage(pdf, 1);

        if (onLoad) onLoad();
      } catch (err: any) {
        if (!mounted) return;
        
        const errorMessage = err.message || 'Failed to load PDF';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      mounted = false;
    };
  }, [url, onLoad, onError]);

  // Disable keyboard shortcuts for saving/downloading
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Block Ctrl+S (Save), Ctrl+Shift+S (Save As), Ctrl+D (Download)
      if ((event.ctrlKey || event.metaKey) && 
          (event.key === 's' || event.key === 'S' || event.key === 'd' || event.key === 'D')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      // Block F12 (Developer Tools)
      if (event.key === 'F12') {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      // Block Ctrl+Shift+I (Developer Tools)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const viewport = page.getViewport({ scale, rotation: 0 });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
    } catch (err: any) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page: ' + err.message);
    }
  };

  const goToPage = async (pageNum: number) => {
    if (!pdfDocument || pageNum < 1 || pageNum > totalPages) return;

    setCurrentPage(pageNum);
    await renderPage(pdfDocument, pageNum);
  };

  const changeScale = async (newScale: number) => {
    if (!pdfDocument) return;

    setScale(newScale);
    await renderPage(pdfDocument, currentPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="pdf-viewer-loading">
        <Loader 
          size="large" 
          color="primary" 
          text="Loading PDF..." 
          context="pdf"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-error">
        <div className="error-icon">❌</div>
        <p>Error: {error}</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          This PDF is protected and cannot be downloaded or saved.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="pdf-viewer-container"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {/* PDF Controls - Minimal with no download options */}
      <div className="pdf-controls">
        <div className="toolbar">
          <div className="toolbar-left">
            <button 
              onClick={prevPage} 
              disabled={currentPage <= 1}
              className="toolbar-btn"
              title="Previous page"
            >
              <svg viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            
            <span className="page-info">
              <input 
                type="number" 
                value={currentPage} 
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    goToPage(page);
                  }
                }}
                min={1}
                max={totalPages}
                className="page-input"
              />
              <span className="page-separator"> of </span>
              <span className="total-pages">{totalPages}</span>
            </span>
            
            <button 
              onClick={nextPage} 
              disabled={currentPage >= totalPages}
              className="toolbar-btn"
              title="Next page"
            >
              <svg viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
          
          <div className="toolbar-center">
            <button 
              onClick={() => changeScale(scale - 0.2)}
              disabled={scale <= 0.5}
              className="toolbar-btn"
              title="Zoom out"
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 13H5v-2h14v2z"/>
              </svg>
            </button>
            
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            
            <button 
              onClick={() => changeScale(scale + 0.2)}
              disabled={scale >= 3.0}
              className="toolbar-btn"
              title="Zoom in"
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          </div>
          
          <div className="toolbar-right">
            <span style={{ 
              fontSize: '11px', 
              color: '#999', 
              marginRight: '8px',
              fontStyle: 'italic'
            }}>
              Protected Content
            </span>
          </div>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="pdf-canvas-container">
        <canvas 
          ref={canvasRef} 
          className="pdf-canvas"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
};

export default SecurePDFViewer;
