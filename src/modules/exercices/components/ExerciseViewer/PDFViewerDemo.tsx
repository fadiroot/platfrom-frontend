import React from 'react';
import PDFViewer from './PDFViewer';

const PDFViewerDemo: React.FC = () => {
  // Sample PDF URL for testing
  const samplePDFUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

  return (
    <div style={{ height: '100vh', padding: '20px' }}>
      <h1>PDF Viewer Demo</h1>
      <div style={{ height: 'calc(100vh - 100px)', border: '1px solid #ccc' }}>
        <PDFViewer 
          url={samplePDFUrl}
          onLoad={() => console.log('PDF loaded successfully')}
          onError={(error) => console.error('PDF loading error:', error)}
        />
      </div>
    </div>
  );
};

export default PDFViewerDemo;
