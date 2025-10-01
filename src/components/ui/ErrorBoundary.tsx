import React from 'react';

interface ErrorBoundaryProps {
  error?: any;
  onRetry?: () => void;
  className?: string;
  title?: string;
  message?: string;
}

export default function ErrorBoundary({ 
  error, 
  onRetry, 
  className = '',
  title = 'Error Loading Data',
  message
}: ErrorBoundaryProps) {
  const errorMessage = message || error?.data?.message || 'An unexpected error occurred';

  return (
    <div className={`cosmic-card p-6 border border-red-500/30 bg-red-500/10 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">{title}</h3>
          <p className="text-red-400/80 text-sm">{errorMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
} 