import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import './_CustomSelect.scss';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  disabled,
  error,
  touched,
  required
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!disabled) {
      // Always open on click, don't toggle
      setIsOpen(true);
      // Don't set hasInteracted on first click - only after user actually selects something
    }
  };

  const handleSelect = (optionValue: string) => {
    console.log('🔍 CustomSelect: Selecting option:', optionValue);
    onChange(optionValue);
    setIsOpen(false);
    setHasInteracted(true); // Only set hasInteracted after user actually selects something
    // Don't call onBlur immediately after selection to avoid validation timing issues
    // The onBlur will be called when the component loses focus naturally
  };

  const handleBlur = () => {
    console.log('🔍 CustomSelect: handleBlur called, isOpen:', isOpen, 'value:', value);
    // Only call onBlur if the dropdown is not open
    if (!isOpen) {
      console.log('🔍 CustomSelect: Calling onBlur');
      onBlur();
    }
  };

  // Auto-focus and open dropdown when component mounts if it's the first field
  useEffect(() => {
    if (selectRef.current && !value && !disabled) {
      // Add a small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        selectRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          // Add a small delay before calling onBlur to ensure the value is properly set
          setTimeout(() => {
            handleBlur();
          }, 100);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setTimeout(() => {
          handleBlur();
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  
  // Only show errors if user has interacted OR if form has been submitted
  const shouldShowError = (hasInteracted || touched) && error;
  const shouldShowSuccess = (hasInteracted || touched) && value && !error;
  const isInvalid = shouldShowError || (required && hasInteracted && !value);

  return (
    <div 
      className={`custom-select ${disabled ? 'disabled' : ''} ${isInvalid ? 'error' : ''} ${shouldShowSuccess ? 'success' : ''}`} 
      ref={selectRef} 
      tabIndex={disabled ? -1 : 0}
      onFocus={() => {
        if (!disabled && !isOpen) {
          setIsOpen(true);
          // Don't set hasInteracted on focus - only after actual interaction
        }
      }}
    >
      <div className="select-trigger" onClick={handleToggle}>
        <span className={value ? 'selected-value' : 'placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="select-icons">
          {isInvalid && <AlertCircle size={16} className="error-icon" />}
          {shouldShowSuccess && <CheckCircle size={16} className="success-icon" />}
          <ChevronDown size={20} className={`chevron ${isOpen ? 'open' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <ul className="options-list">
          {options.map(option => (
            <li
              key={option.value}
              className={`option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = option.value === value ? '#e3f2fd' : 'transparent';
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={18} className="check-icon" />}
            </li>
          ))}
        </ul>
      )}
      {isInvalid && (
        <div className="error-message">
          {error || (required && !value ? 'This field is required' : '')}
        </div>
      )}
    </div>
  );
};

export default CustomSelect; 