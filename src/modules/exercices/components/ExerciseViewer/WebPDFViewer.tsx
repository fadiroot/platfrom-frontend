import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './WebPDFViewer.scss';
import { PDFViewerProps } from './types';

// Configure PDF.js worker with multiple fallback options
const setupWorker = () => {
  // Use unpkg CDN which is more reliable
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  
  // Alternative fallback options
  const fallbackWorkers = [
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
    new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString()
  ];
  
  // Test worker loading and fallback if needed
  const testWorker = async () => {
    try {
      const response = await fetch(pdfjs.GlobalWorkerOptions.workerSrc);
      if (!response.ok) {
        throw new Error('Worker not found');
      }
    } catch (error) {
      console.warn('Primary worker failed, trying fallbacks...');
      for (const fallback of fallbackWorkers) {
        try {
          const response = await fetch(fallback);
          if (response.ok) {
            pdfjs.GlobalWorkerOptions.workerSrc = fallback;
            console.log('Using fallback worker:', fallback);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
  };
  
  testWorker();
};

setupWorker();

const WebPDFViewer: React.FC<PDFViewerProps> = ({ url, onLoad, onError }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Handle PDF document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
    onLoad?.();
  };

  // Handle PDF document load error
  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    
    // Try react-pdf first, then fallback to direct iframe (faster than Google Docs)
    if (!useFallback && retryCount < 2) {
      console.log('React-pdf failed, trying direct iframe fallback');
      setUseFallback(true);
      setRetryCount(retryCount + 1);
      setLoading(true);
      setError('');
      return;
    }
    
    let errorMessage = 'Failed to load PDF';
    
    // Provide more specific error messages
    if (error.message.includes('worker')) {
      errorMessage = 'PDF worker failed to load. Please refresh the page.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error loading PDF. Please check your connection.';
    } else if (error.message.includes('Invalid PDF')) {
      errorMessage = 'Invalid PDF file format.';
    }
    
    setError(errorMessage);
    setLoading(false);
    onError?.(errorMessage);
  };

  // Handle page load error
  const onPageLoadError = (error: Error) => {
    console.error('Page load error:', error);
  };

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-load when URL changes
  useEffect(() => {
    if (url) {
      setLoading(true);
      setError('');
      setPageNumber(1); // Reset to first page
      setUseFallback(false); // Reset fallback state
      setRetryCount(0); // Reset retry count
      
      // Aggressive timeout for faster fallback
      const fallbackTimer = setTimeout(() => {
        if (loading && !useFallback) {
          console.log('React-pdf taking too long, switching to iframe');
          setUseFallback(true);
          setRetryCount(1);
        }
      }, 3000); // 3 seconds instead of waiting longer
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [url]);

  return (
    <div className="web-pdf-viewer">
      {loading && (
        <div className="pdf-loading">
          <div className="loading-spinner"></div>
        </div>
      )}

      {error && (
        <div className="pdf-error">
          <div className="error-icon">📄</div>
          <p>{error}</p>
        </div>
      )}

      {!error && url && (
        <div className="pdf-container">
          {useFallback ? (
            // Direct iframe fallback (faster than Google Docs viewer)
            <>
              <iframe
                src={url}
                width="100%"
                height="100%"
                frameBorder="0"
                title="PDF Viewer"
                onLoad={() => {
                  setLoading(false);
                  onLoad?.();
                }}
                onError={() => {
                  setError('Failed to load PDF');
                  setLoading(false);
                  onError?.('Failed to load PDF');
                }}
                className="pdf-iframe"
                style={{ border: 'none' }}
              />
              {/* Adaptive blocking div for download controls */}
              <div className={`download-blocker-top ${isMobile ? 'mobile' : 'desktop'}`}></div>
            </>
          ) : (
            // Primary react-pdf implementation
            <>
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                error=""
              >
                <Page
                  pageNumber={pageNumber}
                  onLoadError={onPageLoadError}
                  width={window.innerWidth * 0.8}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
              
              {numPages > 1 && (
                <div className="pdf-navigation">
                  <button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                    className="nav-button"
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                    disabled={pageNumber >= numPages}
                    className="nav-button"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WebPDFViewer;
