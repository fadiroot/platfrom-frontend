import React from 'react';
import './Loader.scss';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  color = 'primary', 
  text,
  fullScreen = false 
}) => {
  const loaderClass = `loader-container ${fullScreen ? 'fullscreen' : ''}`;
  const spinnerClass = `loader-spinner ${size} ${color}`;

  return (
    <div className={loaderClass}>
      <div className={spinnerClass}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;



