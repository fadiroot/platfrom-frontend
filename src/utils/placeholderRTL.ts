/**
 * Utility to force all input placeholders to be LTR
 * This is a JavaScript approach to ensure placeholders are always LTR
 */

export const forcePlaceholdersLTR = () => {
  // Get all input and textarea elements
  const inputs = document.querySelectorAll('input, textarea');
  
  inputs.forEach((input: Element) => {
    const htmlInput = input as HTMLInputElement | HTMLTextAreaElement;
    
    // Force LTR direction for placeholder
    htmlInput.style.setProperty('--placeholder-direction', 'ltr', 'important');
    htmlInput.style.setProperty('--placeholder-text-align', 'left', 'important');
    
    // Add CSS class for additional specificity
    htmlInput.classList.add('force-ltr-placeholder');
    
    // For WebKit browsers, we can also try to manipulate the placeholder directly
    if (htmlInput.placeholder) {
      // Store original placeholder
      const originalPlaceholder = htmlInput.placeholder;
      
      // Temporarily clear and reset placeholder to force re-render
      htmlInput.placeholder = '';
      setTimeout(() => {
        htmlInput.placeholder = originalPlaceholder;
      }, 0);
    }
  });
};

/**
 * Hook to force placeholders LTR when component mounts
 */
export const useForcePlaceholdersLTR = () => {
  // Run on mount and when language changes
  const runForcePlaceholders = () => {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      forcePlaceholdersLTR();
    }, 100);
  };
  
  return { forcePlaceholdersLTR: runForcePlaceholders };
};

/**
 * Observer to watch for new input elements and force their placeholders to be LTR
 */
export const observeNewInputs = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check if the added node is an input or contains inputs
          const inputs = element.matches('input, textarea') 
            ? [element] 
            : element.querySelectorAll('input, textarea');
          
          inputs.forEach((input: Element) => {
            const htmlInput = input as HTMLInputElement | HTMLTextAreaElement;
            htmlInput.classList.add('force-ltr-placeholder');
            htmlInput.style.setProperty('--placeholder-direction', 'ltr', 'important');
            htmlInput.style.setProperty('--placeholder-text-align', 'left', 'important');
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
};
