/**
 * Utility to force RTL direction for input placeholders in Arabic mode
 */

export function forcePlaceholderRTL(element: HTMLInputElement | HTMLTextAreaElement): void {
  // Set CSS custom properties for RTL placeholder
  element.style.setProperty('--placeholder-direction', 'rtl');
  element.style.setProperty('--placeholder-text-align', 'start');
  element.style.setProperty('--placeholder-unicode-bidi', 'embed');
  
  // Add utility class
  element.classList.add('force-rtl-placeholder');
  
  // Direct style application for maximum compatibility
  element.setAttribute('dir', 'rtl');
  element.style.direction = 'rtl';
  element.style.textAlign = 'start';
  element.style.textIndent = '0';
  element.style.paddingLeft = '0';
  element.style.paddingRight = '12px';
  element.style.marginLeft = '0';
  element.style.marginRight = '0';
  element.style.transform = 'translateX(0)';
}

export const applyRTLToAllInputs = () => {
  // Only run in Arabic mode
  if (document.documentElement.lang !== 'ar') {
    return;
  }

  const inputs = document.querySelectorAll('input, textarea');
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement;
    
    // Apply RTL formatting if element has placeholder
    if (element.placeholder) {
      forcePlaceholderRTL(element);
    }
  });
};

export const observePlaceholderDirection = () => {
  // Run immediately
  applyRTLToAllInputs();
  
  // Create observer for dynamically added inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check if the added node is an input or contains inputs
          const inputs = element.matches('input, textarea') 
            ? [element] 
            : element.querySelectorAll('input, textarea');
            
          inputs.forEach((input) => {
            const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
            if (inputElement.placeholder && document.documentElement.lang === 'ar') {
              forcePlaceholderRTL(inputElement);
            }
          });
        }
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
};

// Auto-run when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observePlaceholderDirection);
  } else {
    observePlaceholderDirection();
  }
}