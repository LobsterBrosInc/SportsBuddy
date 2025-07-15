/**
 * PitchingMatchup component with visual comparison and statistical analysis
 */

import React from 'react';
import { PitchingMatchupProps } from '../types';

const PitchingMatchup: React.FC<PitchingMatchupProps> = ({ matchup, className = '' }) => {
  const { giants, opponent, advantage } = matchup;

  // Helper function to determine stat quality color
  const getStatColor = (stat: string, value: number): string => {
    if (stat === 'era') {
      if (value <= 3.0) return 'stat-excellent';
      if (value <= 4.0) return 'stat-good';
      if (value <= 5.0) return 'stat-average';
      return 'stat-poor';
    }

    if (stat === 'strikeouts') {
      if (value >= 150) return 'stat-excellent';
      if (value >= 100) return 'stat-good';
      if (value >= 75) return 'stat-average';
      return 'stat-poor';
    }

    if (stat === 'wins') {
      if (value >= 12) return 'stat-excellent';
      if (value >= 8) return 'stat-good';
      if (value >= 5) return 'stat-average';
      return 'stat-poor';
    }

    return 'stat-average';
  };

  // Helper function to get recent form trend icon
  const getFormTrend = (form: string): { icon: string; color: string } => {
    const lowerForm = form.toLowerCase();
    if (lowerForm.includes('excellent') || lowerForm.includes('strong')) {
      return { icon: '📈', color: 'trend-up' };
    }
    if (lowerForm.includes('good') || lowerForm.includes('solid')) {
      return { icon: '➡️', color: 'trend-stable' };
    }
    if (lowerForm.includes('poor') || lowerForm.includes('struggling')) {
      return { icon: '📉', color: 'trend-down' };
    }
    return { icon: '➡️', color: 'trend-stable' };
  };

  // Calculate win percentage
  const getWinPercentage = (wins: number, losses: number): number => {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  // Visual comparison bar component
  const StatComparison: React.FC<{
    label: string;
    giantsValue: number;
    opponentValue: number;
    unit?: string;
    isLowerBetter?: boolean;
  }> = ({ label, giantsValue, opponentValue, unit = '', isLowerBetter = true }) => {
    const giantsAdvantage = isLowerBetter
      ? giantsValue < opponentValue
      : giantsValue > opponentValue;

    const maxValue = Math.max(giantsValue, opponentValue);
    const giantsPercentage = (giantsValue / maxValue) * 100;
    const opponentPercentage = (opponentValue / maxValue) * 100;

    return (
      <div className="stat-comparison">
        <div className="stat-label">{label}</div>
        <div className="stat-bars">
          <div className="stat-bar giants-bar">
            <div className="stat-value">
              {giantsValue}
              {unit}
            </div>
            <div className="bar-container">
              <div
                className={`bar-fill ${giantsAdvantage ? 'bar-advantage' : 'bar-neutral'}`}
                style={{ width: `${giantsPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="stat-bar opponent-bar">
            <div className="stat-value">
              {opponentValue}
              {unit}
            </div>
            <div className="bar-container">
              <div
                className={`bar-fill ${!giantsAdvantage ? 'bar-advantage' : 'bar-neutral'}`}
                style={{ width: `${opponentPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const giantsFormTrend = getFormTrend(giants.recentForm);
  const opponentFormTrend = getFormTrend(opponent.recentForm);

  return (
    <div className={`pitching-matchup ${className}`}>
      <div className="matchup-header">
        <h2>Pitching Matchup</h2>
        <div className="advantage-indicator">
          <span className="advantage-text">{advantage}</span>
        </div>
      </div>

      {/* Pitcher Overview */}
      <div className="pitchers-overview">
        <div className="pitcher giants-pitcher">
          <div className="pitcher-header">
            <h3 className="pitcher-name">{giants.name}</h3>
            <div className="team-badge giants-badge">SF Giants</div>
          </div>
          <div className="pitcher-record">
            <span className="record">
              {giants.wins}-{giants.losses}
            </span>
            <span className="win-pct">({getWinPercentage(giants.wins, giants.losses)}%)</span>
          </div>
          <div className="recent-form">
            <span className="form-label">Recent Form:</span>
            <span className={`form-value ${giantsFormTrend.color}`}>
              <span className="form-icon">{giantsFormTrend.icon}</span>
              {giants.recentForm}
            </span>
          </div>
        </div>

        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>

        <div className="pitcher opponent-pitcher">
          <div className="pitcher-header">
            <h3 className="pitcher-name">{opponent.name}</h3>
            <div className="team-badge opponent-badge">Opponent</div>
          </div>
          <div className="pitcher-record">
            <span className="record">
              {opponent.wins}-{opponent.losses}
            </span>
            <span className="win-pct">({getWinPercentage(opponent.wins, opponent.losses)}%)</span>
          </div>
          <div className="recent-form">
            <span className="form-label">Recent Form:</span>
            <span className={`form-value ${opponentFormTrend.color}`}>
              <span className="form-icon">{opponentFormTrend.icon}</span>
              {opponent.recentForm}
            </span>
          </div>
        </div>
      </div>

      {/* Statistical Comparisons */}
      <div className="stats-comparison">
        <h4>Season Statistics</h4>

        <StatComparison
          label="ERA"
          giantsValue={giants.era}
          opponentValue={opponent.era}
          isLowerBetter={true}
        />

        <StatComparison
          label="Strikeouts"
          giantsValue={giants.strikeouts}
          opponentValue={opponent.strikeouts}
          isLowerBetter={false}
        />

        <StatComparison
          label="Wins"
          giantsValue={giants.wins}
          opponentValue={opponent.wins}
          isLowerBetter={false}
        />
      </div>

      {/* Key Stats Grid */}
      <div className="key-stats-grid">
        <div className="pitcher-stats giants-stats">
          <h5>Giants Pitcher</h5>
          <div className="stat-grid">
            <div className={`stat-item ${getStatColor('era', giants.era)}`}>
              <span className="stat-label">ERA</span>
              <span className="stat-value">{giants.era}</span>
            </div>
            <div className={`stat-item ${getStatColor('strikeouts', giants.strikeouts)}`}>
              <span className="stat-label">K's</span>
              <span className="stat-value">{giants.strikeouts}</span>
            </div>
            <div className={`stat-item ${getStatColor('wins', giants.wins)}`}>
              <span className="stat-label">Wins</span>
              <span className="stat-value">{giants.wins}</span>
            </div>
          </div>
        </div>

        <div className="pitcher-stats opponent-stats">
          <h5>Opponent Pitcher</h5>
          <div className="stat-grid">
            <div className={`stat-item ${getStatColor('era', opponent.era)}`}>
              <span className="stat-label">ERA</span>
              <span className="stat-value">{opponent.era}</span>
            </div>
            <div className={`stat-item ${getStatColor('strikeouts', opponent.strikeouts)}`}>
              <span className="stat-label">K's</span>
              <span className="stat-value">{opponent.strikeouts}</span>
            </div>
            <div className={`stat-item ${getStatColor('wins', opponent.wins)}`}>
              <span className="stat-label">Wins</span>
              <span className="stat-value">{opponent.wins}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchingMatchup;
