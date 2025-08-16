import React from 'react';
import './Loader.scss';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white' | 'success' | 'warning' | 'danger';
  text?: string;
  fullScreen?: boolean;
  context?: 'pdf' | 'exercise' | 'file' | 'general';
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  color = 'primary', 
  text,
  fullScreen = false,
  context = 'general'
}) => {
  const loaderClass = `loader-container ${fullScreen ? 'fullscreen' : ''} ${context}-loading`;
  const spinnerClass = `loader-spinner ${size} ${color}`;

  return (
    <div className={loaderClass}>
      <div className={spinnerClass}></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;



