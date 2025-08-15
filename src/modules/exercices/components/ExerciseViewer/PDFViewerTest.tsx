import React from 'react';
import PDFViewer from './PDFViewer';

const PDFViewerTest: React.FC = () => {
  const testPDFs = [
    {
      name: 'Sample PDF 1',
      url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
    },
    {
      name: 'Sample PDF 2', 
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>PDF Viewer Test Page</h1>
      <p>This page tests the PDF viewer component with different sample PDFs.</p>
      
      {testPDFs.map((pdf, index) => (
        <div key={index} style={{ marginBottom: '40px' }}>
          <h2>{pdf.name}</h2>
          <div style={{ height: '600px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
            <PDFViewer 
              url={pdf.url}
              onLoad={() => console.log(`${pdf.name} loaded successfully`)}
              onError={(error) => console.error(`${pdf.name} loading error:`, error)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PDFViewerTest;
