import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFViewerProps } from './types';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Alternative worker sources if the main one fails
const WORKER_SOURCES = [
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
  `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
];

const PDFViewer: React.FC<PDFViewerProps> = ({ url, onLoad, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading PDF from URL:', url);

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!mounted) return;

        console.log('PDF loaded successfully, pages:', pdf.numPages);

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
        console.error('PDF loading error:', err);
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pdfDocument) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextPage();
          break;
        case '+':
        case '=':
          event.preventDefault();
          changeScale(scale + 0.2);
          break;
        case '-':
          event.preventDefault();
          changeScale(scale - 0.2);
          break;
        case '0':
          event.preventDefault();
          setScale(1.0);
          renderPage(pdfDocument, currentPage);
          break;
        case 'r':
          event.preventDefault();
          rotate(90);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pdfDocument, currentPage, scale]);

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) {
      console.error('Canvas ref is null');
      return;
    }

    try {
      console.log('Rendering page:', pageNum, 'with scale:', scale, 'rotation:', rotation);
      
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Could not get 2D context');
        return;
      }

      const viewport = page.getViewport({ scale, rotation });
      console.log('Viewport dimensions:', viewport.width, 'x', viewport.height);
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      console.log('Starting page render...');
      await page.render(renderContext).promise;
      console.log('Page render completed successfully');
      
    } catch (err) {
      console.error('Error rendering page:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
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

  const rotate = async (degrees: number) => {
    if (!pdfDocument) return;

    setRotation((prev) => (prev + degrees) % 360);
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

  const fitToWidth = async () => {
    if (!canvasRef.current || !pdfDocument) return;
    
    const canvas = canvasRef.current;
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const page = await pdfDocument.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1, rotation });
    const newScale = (containerWidth - 40) / viewport.width;
    
    setScale(newScale);
    await renderPage(pdfDocument, currentPage);
  };

  const fitToPage = async () => {
    if (!canvasRef.current || !pdfDocument) return;
    
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;
    
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    const page = await pdfDocument.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1, rotation });
    
    const scaleX = containerWidth / viewport.width;
    const scaleY = containerHeight / viewport.height;
    const newScale = Math.min(scaleX, scaleY);
    
    setScale(newScale);
    await renderPage(pdfDocument, currentPage);
  };

  if (loading) {
    return (
      <div className="pdf-viewer-loading">
        <div className="loading-spinner"></div>
        <p>Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-error">
        <div className="error-icon">❌</div>
        <p>Error: {error}</p>
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => {
              // Try to use browser's built-in PDF viewer
              const iframe = document.createElement('iframe');
              iframe.src = url;
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
              
              const container = document.querySelector('.pdf-canvas-container');
              if (container) {
                container.innerHTML = '';
                container.appendChild(iframe);
              }
            }}
            style={{ 
              padding: '8px 16px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Try Browser PDF Viewer
          </button>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '8px 16px', 
              background: '#007bff', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            Open PDF in New Tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container">
      {/* PDF Controls - Official PDF.js Style */}
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
            
            <span className="zoom-level">+ {Math.round(scale * 100)}%</span>
            
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
            
            <button 
              onClick={fitToWidth}
              className="toolbar-btn"
              title="Fit to width"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
              </svg>
            </button>
            
            <button 
              onClick={fitToPage}
              className="toolbar-btn"
              title="Fit to page"
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              </svg>
            </button>
            
            <button 
              onClick={() => rotate(90)}
              className="toolbar-btn"
              title="Rotate clockwise"
            >
              <svg viewBox="0 0 24 24">
                <path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10v-2.93c1.39.17 2.74.71 3.9 1.61l1.42-1.42c-.75-.52-1.59-.87-2.47-1.01z"/>
              </svg>
            </button>
          </div>
          
          <div className="toolbar-right">
            <button 
              className="toolbar-btn"
              title="Text selection tool"
            >
              <svg viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            <button 
              className="toolbar-btn"
              title="Hand tool"
            >
              <svg viewBox="0 0 24 24">
                <path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 4.5m0 0V14m0-2.5v-6a1.5 1.5 0 013 0m-3 6a1.5 1.5 0 013 0v2a7.5 7.5 0 01-15 4.5m0 0V14"/>
              </svg>
            </button>
            <button 
              className="toolbar-btn"
              title="Scrolling"
            >
              <svg viewBox="0 0 24 24">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </button>
         
            <button 
              className="toolbar-btn"
              title="Secondary menu"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="pdf-canvas-container">
        <canvas 
          ref={canvasRef} 
          className="pdf-canvas"
        />
      </div>
    </div>
  );
};

export default PDFViewer;
