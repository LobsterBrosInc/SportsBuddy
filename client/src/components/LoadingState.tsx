/**
 * LoadingState component with skeleton UI and Giants branding
 */

import React from 'react';
import { LoadingStateProps } from '../types';

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Giants game data...',
  showProgress = false,
  className = '',
}) => {
  return (
    <div className={`loading-state ${className}`}>
      <div className="loading-container">
        {/* Giants-branded loading spinner */}
        <div className="loading-spinner">
          <div className="giants-logo-spinner">
            <div className="spinner-circle"></div>
            <div className="spinner-text">SF</div>
          </div>
        </div>

        {/* Loading message */}
        <div className="loading-message">
          <h3>{message}</h3>
          {showProgress && (
            <div className="loading-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <span className="progress-text">Fetching latest data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Skeleton layout matching final structure */}
      <div className="skeleton-layout">
        {/* Game header skeleton */}
        <div className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-subtitle"></div>
          </div>
          <div className="skeleton-content">
            <div className="skeleton-teams">
              <div className="skeleton-team">
                <div className="skeleton-team-name"></div>
                <div className="skeleton-team-record"></div>
              </div>
              <div className="skeleton-vs">VS</div>
              <div className="skeleton-team">
                <div className="skeleton-team-name"></div>
                <div className="skeleton-team-record"></div>
              </div>
            </div>
            <div className="skeleton-game-info">
              <div className="skeleton-line skeleton-time"></div>
              <div className="skeleton-line skeleton-venue"></div>
            </div>
          </div>
        </div>

        {/* Pitching matchup skeleton */}
        <div className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-section-title"></div>
          </div>
          <div className="skeleton-matchup">
            <div className="skeleton-pitcher">
              <div className="skeleton-pitcher-name"></div>
              <div className="skeleton-stats">
                <div className="skeleton-stat"></div>
                <div className="skeleton-stat"></div>
                <div className="skeleton-stat"></div>
              </div>
            </div>
            <div className="skeleton-vs-icon"></div>
            <div className="skeleton-pitcher">
              <div className="skeleton-pitcher-name"></div>
              <div className="skeleton-stats">
                <div className="skeleton-stat"></div>
                <div className="skeleton-stat"></div>
                <div className="skeleton-stat"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Key insights skeleton */}
        <div className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-section-title"></div>
          </div>
          <div className="skeleton-insights">
            <div className="skeleton-insight">
              <div className="skeleton-bullet"></div>
              <div className="skeleton-insight-text"></div>
            </div>
            <div className="skeleton-insight">
              <div className="skeleton-bullet"></div>
              <div className="skeleton-insight-text"></div>
            </div>
            <div className="skeleton-insight">
              <div className="skeleton-bullet"></div>
              <div className="skeleton-insight-text"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
