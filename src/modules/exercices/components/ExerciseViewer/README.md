# PDF Viewer Integration

This module integrates PDF.js into the exercise viewer to provide a robust PDF viewing experience.

## Components

### PDFViewer
A React component that renders PDF documents using PDF.js.

**Props:**
- `url: string` - The URL of the PDF file to display
- `onLoad?: () => void` - Callback function called when PDF loads successfully
- `onError?: (error: string) => void` - Callback function called when PDF fails to load

**Features:**
- Page navigation (Previous/Next)
- Zoom controls (Zoom In/Out)
- Page information display
- Loading and error states
- Responsive design

### ExerciseViewer
The main exercise viewer component that integrates the PDF viewer.

**Integration:**
- Automatically displays PDF files when available
- Switches between exercise and solution PDFs
- Handles file access permissions
- Provides fallback UI when no PDF is available

## Usage

```tsx
import PDFViewer from './PDFViewer';

// Basic usage
<PDFViewer 
  url="https://example.com/document.pdf"
  onLoad={() => console.log('PDF loaded')}
  onError={(error) => console.error('PDF error:', error)}
/>
```

## Dependencies

- `pdfjs-dist` - PDF.js library for PDF rendering
- `react-icons` - Icons for the UI components

## Installation

The required dependencies are already installed:

```bash
npm install pdfjs-dist @types/pdfjs-dist react-icons
```

## Features

1. **PDF Rendering**: Uses PDF.js to render PDF documents on HTML5 canvas
2. **Navigation**: Previous/Next page buttons with page information
3. **Zoom Controls**: Zoom in/out functionality with percentage display
4. **Responsive Design**: Works on desktop and mobile devices
5. **Error Handling**: Graceful error handling with user-friendly messages
6. **Loading States**: Loading spinner while PDF is being processed

## Browser Support

PDF.js supports all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance

- PDFs are rendered on-demand
- Canvas-based rendering for optimal performance
- Automatic cleanup of resources when component unmounts

## Customization

The PDF viewer can be customized by modifying the SCSS files:
- `PDFViewer.scss` - Styles for the PDF viewer component
- `ExerciseViewer.scss` - Integration styles

## Troubleshooting

1. **PDF not loading**: Check if the URL is accessible and CORS is properly configured
2. **Worker errors**: Ensure the PDF.js worker is properly loaded from CDN
3. **Performance issues**: Consider implementing PDF preloading for better UX
