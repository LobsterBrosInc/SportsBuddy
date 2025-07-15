/**
 * Main App Component
 * SF Giants Next Game Preview - Single-page application with auto-refresh
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import GamePreview from './components/GamePreview';
import PitchingMatchup from './components/PitchingMatchup';
import KeyInsights from './components/KeyInsights';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { useGameData } from './hooks/useGameData';
import './App.css';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app error-boundary">
          <div className="error-boundary-container">
            <h1>Something went wrong</h1>
            <p>An unexpected error occurred in the application.</p>
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
            <button onClick={() => window.location.reload()} className="error-reload-button">
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component
const AppContent: React.FC = () => {
  const { data, loading, error, retry, refresh, lastUpdated } = useGameData();

  // Manual refresh handler
  const handleRefresh = () => {
    refresh();
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="giants-logo">⚾</span>
              SF Giants Game Preview
            </h1>
          </div>
        </header>
        <main className="app-main">
          <LoadingState message="Loading Giants game data..." showProgress={true} />
        </main>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="giants-logo">⚾</span>
              SF Giants Game Preview
            </h1>
          </div>
        </header>
        <main className="app-main">
          <ErrorState error={error} onRetry={retry} retrying={loading} showContact={true} />
        </main>
      </div>
    );
  }

  // Success state with data
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-main">
            <h1 className="app-title">
              <span className="giants-logo">⚾</span>
              SF Giants Game Preview
            </h1>
            <div className="header-actions">
              <button
                onClick={handleRefresh}
                className={`refresh-button ${loading ? 'refreshing' : ''}`}
                disabled={loading}
                aria-label="Refresh game data"
              >
                <span className="refresh-icon">🔄</span>
                {loading ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>

          {data && (
            <div className="header-subtitle">
              <span>Next Game Analysis</span>
              {lastUpdated && (
                <span className="last-updated">• Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {data ? (
          <div className="game-content">
            {/* Game Overview */}
            <section className="content-section">
              <GamePreview gameData={data} lastUpdated={lastUpdated} className="game-overview" />
            </section>

            {/* Pitching Matchup */}
            <section className="content-section">
              <PitchingMatchup matchup={data.pitchingMatchup} className="pitching-analysis" />
            </section>

            {/* Key Insights */}
            <section className="content-section">
              <KeyInsights
                insights={data.keyInsights}
                title="AI Game Analysis"
                expandable={true}
                className="game-insights"
              />
            </section>
          </div>
        ) : (
          <div className="no-data">
            <h2>No Game Data Available</h2>
            <p>Unable to load Giants game information at this time.</p>
            <button onClick={retry} className="retry-button">
              Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-main">
            <p>&copy; 2024 SF Giants Game Preview</p>
            <p>Powered by MLB Stats API & AI Analysis</p>
          </div>
          <div className="footer-links">
            <a href="https://www.mlb.com/giants" target="_blank" rel="noopener noreferrer">
              Official Giants Site
            </a>
            <span className="separator">•</span>
            <a href="https://www.mlb.com/stats" target="_blank" rel="noopener noreferrer">
              MLB Stats
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App with Error Boundary
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
