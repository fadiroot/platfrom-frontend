import React from 'react';
import './Loader.scss';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white' | 'success' | 'warning' | 'danger';
  text?: string;
  fullScreen?: boolean;
  context?: 'pdf' | 'exercise' | 'file' | 'general';
  type?: 'spinner' | 'astuce';
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  color = 'primary', 
  text,
  fullScreen = false,
  context = 'general',
  type = 'astuce'
}) => {
  const loaderClass = `loader-container ${fullScreen ? 'fullscreen' : ''} ${context}-loading`;
  const spinnerClass = `loader-spinner ${size} ${color}`;

  // Astuce text animation loader
  if (type === 'astuce') {
    return (
      <div className={loaderClass}>
        <div className={`astuce-loader ${size}`}>
          <span className="letter a">A</span>
          <span className="letter s">s</span>
          <span className="letter t">t</span>
          <span className="letter u">u</span>
          <span className="letter c">c</span>
          <span className="letter e">e</span>
        </div>
        {text && <p className="loader-text">{text}</p>}
      </div>
    );
  }

  // Original spinner loader
  return (
    <div className={loaderClass}>
      <div className={spinnerClass}></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;



