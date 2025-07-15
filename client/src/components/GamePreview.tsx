/**
 * GamePreview Component
 * Displays Giants game overview with enhanced layout and branding
 */

import React from 'react';
import { format } from 'date-fns';
import { GamePreviewCardProps } from '../types';

const GamePreview: React.FC<GamePreviewCardProps> = ({ gameData, lastUpdated, className = '' }) => {
  const { game } = gameData;

  // Determine if Giants are home or away
  const giantsIsHome = game.homeTeam.name.includes('Giants') || game.homeTeam.abbreviation === 'SF';
  const giantsTeam = giantsIsHome ? game.homeTeam : game.awayTeam;
  const opponentTeam = giantsIsHome ? game.awayTeam : game.homeTeam;

  // Parse date for display
  const gameDate = new Date(game.date);
  const isToday = new Date().toDateString() === gameDate.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === gameDate.toDateString();

  const getDateLabel = () => {
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return format(gameDate, 'EEEE, MMMM d');
  };

  const getTimeLabel = () => {
    return format(gameDate, 'h:mm a');
  };

  // Extract wins and losses from record string (e.g., "45-42")
  const parseRecord = (record: string) => {
    const parts = record.split('-').map(Number);
    const wins = parts[0] || 0;
    const losses = parts[1] || 0;
    return { wins, losses };
  };

  const giantsRecord = parseRecord(giantsTeam.record);
  const opponentRecord = parseRecord(opponentTeam.record);

  // Calculate win percentage
  const getWinPct = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? (wins / total).toFixed(3) : '.000';
  };

  // Get recent form indication (simplified)
  const getFormIndicator = (wins: number, losses: number) => {
    const pct = wins / (wins + losses);
    if (pct >= 0.6) return { text: 'Hot', color: 'form-hot', icon: '🔥' };
    if (pct >= 0.4) return { text: 'Average', color: 'form-average', icon: '➡️' };
    return { text: 'Cold', color: 'form-cold', icon: '🧊' };
  };

  const giantsForm = getFormIndicator(giantsRecord.wins, giantsRecord.losses);
  const opponentForm = getFormIndicator(opponentRecord.wins, opponentRecord.losses);

  return (
    <div className={`game-preview-card ${className}`}>
      {/* Game Header */}
      <div className="game-header">
        <div className="game-title">
          <h1>
            {giantsIsHome ? (
              <>
                <span className="opponent-name">{opponentTeam.name}</span>
                <span className="vs-text"> @ </span>
                <span className="giants-name">San Francisco Giants</span>
              </>
            ) : (
              <>
                <span className="giants-name">San Francisco Giants</span>
                <span className="vs-text"> @ </span>
                <span className="opponent-name">{opponentTeam.name}</span>
              </>
            )}
          </h1>
        </div>

        <div className="game-date-time">
          <div className="date-info">
            <span className="date-label">{getDateLabel()}</span>
            <span className="time-label">{getTimeLabel()}</span>
          </div>
          <div className="venue-info">
            <span className="venue-icon">🏟️</span>
            <span className="venue-name">{game.venue}</span>
          </div>
        </div>
      </div>

      {/* Team Matchup */}
      <div className="team-matchup">
        <div className="team-section giants-section">
          <div className="team-info">
            <div className="team-header">
              <h3 className="team-name">San Francisco Giants</h3>
              <div className="team-badge giants-badge">SF</div>
            </div>
            <div className="team-record">
              <span className="record-text">{giantsTeam.record}</span>
              <span className="win-pct">({getWinPct(giantsRecord.wins, giantsRecord.losses)})</span>
            </div>
            <div className="team-form">
              <span className="form-label">Form:</span>
              <span className={`form-indicator ${giantsForm.color}`}>
                <span className="form-icon">{giantsForm.icon}</span>
                <span className="form-text">{giantsForm.text}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="matchup-center">
          <div className="vs-circle">
            <span className="vs-text">VS</span>
          </div>
          <div className="game-status">
            <span className="status-badge">{game.status}</span>
          </div>
        </div>

        <div className="team-section opponent-section">
          <div className="team-info">
            <div className="team-header">
              <h3 className="team-name">{opponentTeam.name}</h3>
              <div className="team-badge opponent-badge">{opponentTeam.abbreviation}</div>
            </div>
            <div className="team-record">
              <span className="record-text">{opponentTeam.record}</span>
              <span className="win-pct">
                ({getWinPct(opponentRecord.wins, opponentRecord.losses)})
              </span>
            </div>
            <div className="team-form">
              <span className="form-label">Form:</span>
              <span className={`form-indicator ${opponentForm.color}`}>
                <span className="form-icon">{opponentForm.icon}</span>
                <span className="form-text">{opponentForm.text}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Summary */}
      <div className="game-summary">
        <div className="summary-header">
          <h4>What to Expect</h4>
        </div>
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-icon">⚾</span>
            <span className="summary-text">
              Pitching matchup features {gameData.pitchingMatchup.giants.name} vs{' '}
              {gameData.pitchingMatchup.opponent.name}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">🏆</span>
            <span className="summary-text">{gameData.pitchingMatchup.advantage}</span>
          </div>
          {gameData.keyInsights.length > 0 && gameData.keyInsights[0] && (
            <div className="summary-item">
              <span className="summary-icon">💡</span>
              <span className="summary-text">{gameData.keyInsights[0].substring(0, 80)}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="update-info">
          <span className="update-icon">🕒</span>
          <span className="update-text">Last updated: {format(lastUpdated, 'MMM d, h:mm a')}</span>
        </div>
      )}
    </div>
  );
};

export default GamePreview;
