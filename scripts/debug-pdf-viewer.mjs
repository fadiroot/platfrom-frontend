#!/usr/bin/env node

/**
 * PDF Viewer Debug Script
 * 
 * This script helps diagnose PDF loading issues by:
 * 1. Testing PDF.js worker availability
 * 2. Checking CORS headers on PDF URLs
 * 3. Validating PDF file format
 * 4. Testing different worker sources
 */

import { createRequire } from 'module';
import https from 'https';
import http from 'http';

const require = createRequire(import.meta.url);

console.log('🔍 PDF Viewer Debug Script');
console.log('==========================\n');

// Test PDF.js versions and compatibility
async function testPDFJSVersions() {
  console.log('📦 Testing PDF.js Versions:');
  
  try {
    // Try to get react-pdf version from package.json
    const pkg = require('../package.json');
    const reactPdfVersion = pkg.dependencies['react-pdf'];
    const pdfjsVersion = pkg.dependencies['pdfjs-dist'];
    
    console.log(`   react-pdf: ${reactPdfVersion}`);
    console.log(`   pdfjs-dist: ${pdfjsVersion}`);
    
    // Check if versions are compatible
    if (reactPdfVersion?.includes('10.') && pdfjsVersion?.includes('5.')) {
      console.log('   ✅ Version compatibility looks good');
    } else {
      console.log('   ⚠️  Version compatibility might be an issue');
      console.log('   💡 Consider updating to compatible versions');
    }
  } catch (error) {
    console.log('   ❌ Error reading package.json:', error.message);
  }
  
  console.log();
}

// Test worker URLs
async function testWorkerURLs() {
  console.log('🔧 Testing PDF.js Worker URLs:');
  
  const workerUrls = [
    'https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.js'
  ];
  
  for (const url of workerUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`   ✅ ${url} - Available`);
      } else {
        console.log(`   ❌ ${url} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${url} - Error: ${error.message}`);
    }
  }
  
  console.log();
}

// Test a sample PDF URL for CORS and accessibility
async function testPDFURL(url) {
  console.log(`🔗 Testing PDF URL: ${url}`);
  
  if (!url) {
    console.log('   ⚠️  No URL provided');
    return;
  }
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type') || 'Not specified'}`);
    console.log(`   Content-Length: ${response.headers.get('content-length') || 'Not specified'}`);
    
    // Check CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
      'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
      'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
    };
    
    console.log('   CORS Headers:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`     ${key}: ${value}`);
      } else {
        console.log(`     ${key}: Not set`);
      }
    });
    
    // Check if it's actually a PDF
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      console.log('   ✅ Content-Type indicates PDF');
    } else {
      console.log(`   ⚠️  Content-Type is not application/pdf: ${contentType}`);
    }
    
    if (response.ok) {
      console.log('   ✅ URL is accessible');
    } else {
      console.log('   ❌ URL returned error status');
    }
    
  } catch (error) {
    console.log(`   ❌ Error accessing URL: ${error.message}`);
    
    if (error.message.includes('CORS')) {
      console.log('   💡 This is likely a CORS issue');
      console.log('   💡 The PDF server needs to allow cross-origin requests');
    } else if (error.message.includes('Network')) {
      console.log('   💡 This might be a network connectivity issue');
    }
  }
  
  console.log();
}

// Test browser environment compatibility
function testBrowserEnvironment() {
  console.log('🌐 Browser Environment Checks:');
  
  // These checks would run in browser context
  console.log('   Note: The following checks should be run in browser console:');
  console.log('   
  // Check if Web Workers are supported
  console.log("Web Workers supported:", typeof Worker !== "undefined");
  
  // Check if ArrayBuffer is supported  
  console.log("ArrayBuffer supported:", typeof ArrayBuffer !== "undefined");
  
  // Check if Uint8Array is supported
  console.log("Uint8Array supported:", typeof Uint8Array !== "undefined");
  
  // Check PDF.js worker status
  if (typeof window !== "undefined" && window.pdfjsLib) {
    console.log("PDF.js loaded:", true);
    console.log("Worker source:", window.pdfjsLib.GlobalWorkerOptions.workerSrc);
  } else {
    console.log("PDF.js loaded:", false);
  }
');
  
  console.log();
}

// Provide troubleshooting recommendations
function provideTroubleshootingTips() {
  console.log('💡 Troubleshooting Recommendations:');
  console.log('=====================================\n');
  
  console.log('1. **CORS Issues:**');
  console.log('   - Ensure your PDF server includes proper CORS headers');
  console.log('   - Add "Access-Control-Allow-Origin: *" header to PDF responses');
  console.log('   - Consider using a CORS proxy for testing\n');
  
  console.log('2. **Worker Loading Issues:**');
  console.log('   - Try different CDN sources for pdf.worker.min.js');
  console.log('   - Host the worker file locally if CDN access is blocked');
  console.log('   - Check browser console for specific worker errors\n');
  
  console.log('3. **Version Compatibility:**');
  console.log('   - Ensure react-pdf and pdfjs-dist versions are compatible');
  console.log('   - Consider downgrading to stable versions if needed');
  console.log('   - Check react-pdf documentation for version matrix\n');
  
  console.log('4. **PDF File Issues:**');
  console.log('   - Verify the PDF file is not corrupted');
  console.log('   - Check if the PDF requires a password');
  console.log('   - Test with a simple, known-good PDF file\n');
  
  console.log('5. **Network Issues:**');
  console.log('   - Check if the PDF URL is accessible from browser');
  console.log('   - Verify SSL certificates if using HTTPS');
  console.log('   - Test with curl or browser dev tools\n');
  
  console.log('6. **Alternative Solutions:**');
  console.log('   - Use Google Docs Viewer as fallback');
  console.log('   - Implement iframe-based PDF viewing');
  console.log('   - Consider server-side PDF to image conversion');
}

// Main execution
async function main() {
  await testPDFJSVersions();
  await testWorkerURLs();
  
  // Test with a sample URL if provided as argument
  const testUrl = process.argv[2];
  if (testUrl) {
    await testPDFURL(testUrl);
  } else {
    console.log('💡 To test a specific PDF URL, run:');
    console.log('   node debug-pdf-viewer.mjs <pdf-url>\n');
  }
  
  testBrowserEnvironment();
  provideTroubleshootingTips();
}

main().catch(console.error);
