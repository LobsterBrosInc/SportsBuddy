/**
 * ErrorState component with comprehensive error handling and user-friendly messaging
 */

import React, { useState } from 'react';
import { ErrorStateProps } from '../types';

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retrying = false,
  showContact = true,
  className = '',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  // Determine error type and provide appropriate messaging
  const getErrorInfo = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('no upcoming giants game') || lowerError.includes('no games found')) {
      return {
        title: 'No Upcoming Games',
        message: 'There are currently no scheduled Giants games to preview.',
        icon: '📅',
        suggestion: 'Check back soon for the next game preview.',
        showRetry: true,
        severity: 'info',
      };
    }

    if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      return {
        title: 'Request Timed Out',
        message: 'The request took too long to complete.',
        icon: '⏱️',
        suggestion: 'Please check your internet connection and try again.',
        showRetry: true,
        severity: 'warning',
      };
    }

    if (
      lowerError.includes('network') ||
      lowerError.includes('connect') ||
      lowerError.includes('fetch')
    ) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the Giants data service.',
        icon: '🌐',
        suggestion: 'Please check your internet connection and try again.',
        showRetry: true,
        severity: 'warning',
      };
    }

    if (
      lowerError.includes('server') ||
      lowerError.includes('unavailable') ||
      lowerError.includes('503')
    ) {
      return {
        title: 'Service Temporarily Unavailable',
        message: 'The Giants data service is experiencing issues.',
        icon: '🔧',
        suggestion: 'Our team is working to resolve this. Please try again in a few minutes.',
        showRetry: true,
        severity: 'error',
      };
    }

    if (
      lowerError.includes('invalid') ||
      lowerError.includes('parse') ||
      lowerError.includes('format')
    ) {
      return {
        title: 'Data Error',
        message: 'There was a problem processing the game data.',
        icon: '⚠️',
        suggestion: 'This is likely a temporary issue. Please try refreshing.',
        showRetry: true,
        severity: 'error',
      };
    }

    // Generic error fallback
    return {
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected error while loading game data.',
      icon: '❗',
      suggestion: 'Please try again. If the problem persists, contact support.',
      showRetry: true,
      severity: 'error',
    };
  };

  const errorInfo = getErrorInfo(error);
  const isCurrentlyRetrying = retrying || isRetrying;

  return (
    <div className={`error-state error-state--${errorInfo.severity} ${className}`}>
      <div className="error-container">
        <div className="error-icon">
          <span role="img" aria-label="Error icon">
            {errorInfo.icon}
          </span>
        </div>

        <div className="error-content">
          <h2 className="error-title">{errorInfo.title}</h2>
          <p className="error-message">{errorInfo.message}</p>
          <p className="error-suggestion">{errorInfo.suggestion}</p>

          {/* Technical error details for debugging (collapsed by default) */}
          <details className="error-details">
            <summary>Technical Details</summary>
            <code className="error-code">{error}</code>
          </details>
        </div>

        <div className="error-actions">
          {errorInfo.showRetry && (
            <button
              className={`retry-button ${isCurrentlyRetrying ? 'retry-button--loading' : ''}`}
              onClick={handleRetry}
              disabled={isCurrentlyRetrying}
              aria-label="Retry loading game data"
            >
              {isCurrentlyRetrying ? (
                <>
                  <span className="retry-spinner"></span>
                  Retrying...
                </>
              ) : (
                <>
                  <span className="retry-icon">🔄</span>
                  Try Again
                </>
              )}
            </button>
          )}

          <button
            className="refresh-button"
            onClick={() => window.location.reload()}
            aria-label="Refresh the page"
          >
            <span className="refresh-icon">↻</span>
            Refresh Page
          </button>
        </div>

        {showContact && errorInfo.severity === 'error' && (
          <div className="error-contact">
            <p className="contact-text">
              Still having trouble?
              <a
                href="mailto:support@giants.com?subject=Game%20Preview%20Error"
                className="contact-link"
              >
                Contact Support
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
