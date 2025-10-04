import React from 'react';
import './SimpleLoader.scss';

interface SimpleLoaderProps {
  size?: number;
  className?: string;
}

const SimpleLoader: React.FC<SimpleLoaderProps> = ({ 
  size = 20, 
  className = '' 
}) => {
  return (
    <div 
      className={`simple-loader ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="spinner"></div>
    </div>
  );
};

export default SimpleLoader;
