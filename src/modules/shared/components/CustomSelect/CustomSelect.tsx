import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
}

const CustomSelect = ({ options, value, onChange, onBlur, placeholder, disabled }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
    if (isOpen) {
      onBlur();
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    onBlur();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        if (isOpen) {
            onBlur();
        }
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`custom-select ${disabled ? 'disabled' : ''}`} ref={selectRef} tabIndex={disabled ? -1 : 0}>
      <div className="select-trigger" onClick={handleToggle}>
        <span className={value ? 'selected-value' : 'placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={20} className={`chevron ${isOpen ? 'open' : ''}`} />
      </div>
      {isOpen && (
        <ul className="options-list">
          {options.map(option => (
            <li
              key={option.value}
              className={`option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={18} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect; 