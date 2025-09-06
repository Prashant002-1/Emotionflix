/**
 * LoadingSpinner Component
 * 
 * Reusable loading indicator with animated spinner and bouncing dots.
 * Supports different sizes and customizable loading messages.
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

/**
 * LoadingSpinner component that displays an animated loading indicator.
 * @param size - Size variant ('sm', 'md', 'lg')
 * @param className - Additional CSS classes for styling
 * @param message - Loading message to display below the spinner
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  message = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`animate-spin rounded-full border-2 border-purple-600/20 border-t-purple-400 ${sizeClasses[size]} ${className}`} />
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      {message && <p className="text-gray-300 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;