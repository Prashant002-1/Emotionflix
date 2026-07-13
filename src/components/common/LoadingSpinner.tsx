import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '', message = 'Loading' }) => (
  <div className={`loading-state ${className}`}>
    <div className="loading-spinner" />
    {message && <span>{message}</span>}
  </div>
);

export default LoadingSpinner;
