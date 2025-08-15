import React from 'react';

interface BrowserPDFViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const BrowserPDFViewer: React.FC<BrowserPDFViewerProps> = ({ url, onLoad, onError }) => {
  const handleLoad = () => {
    if (onLoad) onLoad();
  };

  const handleError = () => {
    if (onError) onError('Failed to load PDF in browser viewer');
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--student-bg-secondary)',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--student-border-primary)',
      boxShadow: 'var(--student-shadow-md)'
    }}>
      {/* Simple toolbar for browser viewer */}
      <div style={{
        background: 'var(--student-bg-tertiary)',
        padding: '12px 16px',
        borderBottom: '1px solid var(--student-border-primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'var(--student-text-primary)',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        <span>Browser PDF Viewer</span>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'var(--student-primary)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid var(--student-border-primary)',
            background: 'var(--student-bg-secondary)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--student-shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--student-shadow-sm)';
          }}
        >
          Open in New Tab
        </a>
      </div>
      
      {/* PDF iframe */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        background: 'var(--student-bg-primary)',
        padding: '8px'
      }}>
        <iframe
          src={url}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'white',
            borderRadius: '6px',
            boxShadow: 'var(--student-shadow-sm)'
          }}
          title="PDF Viewer"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default BrowserPDFViewer;
