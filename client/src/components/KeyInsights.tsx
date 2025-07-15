/**
 * KeyInsights component for displaying AI-generated game analysis and narratives
 */

import React, { useState } from 'react';
import { KeyInsightsProps } from '../types';

const KeyInsights: React.FC<KeyInsightsProps> = ({
  insights,
  title = 'Key Insights',
  expandable = true,
  className = '',
}) => {
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set());

  // Categorize insights based on content keywords
  const categorizeInsight = (
    insight: string
  ): {
    category: string;
    icon: string;
    color: string;
    priority: number;
  } => {
    const lowerInsight = insight.toLowerCase();

    // Pitching-related insights (highest priority)
    if (
      lowerInsight.includes('pitcher') ||
      lowerInsight.includes('era') ||
      lowerInsight.includes('strikeout') ||
      lowerInsight.includes('splitter') ||
      lowerInsight.includes('fastball') ||
      lowerInsight.includes('dominant')
    ) {
      return {
        category: 'Pitching Edge',
        icon: '⚾',
        color: 'insight-pitching',
        priority: 1,
      };
    }

    // Offensive/batting insights
    if (
      lowerInsight.includes('offense') ||
      lowerInsight.includes('batting') ||
      lowerInsight.includes('hitting') ||
      lowerInsight.includes('runs') ||
      lowerInsight.includes('struggling') ||
      lowerInsight.includes('hot')
    ) {
      return {
        category: 'Offensive Key',
        icon: '🏏',
        color: 'insight-offense',
        priority: 2,
      };
    }

    // Historical/matchup insights
    if (
      lowerInsight.includes('historically') ||
      lowerInsight.includes('history') ||
      lowerInsight.includes('past') ||
      lowerInsight.includes('record') ||
      lowerInsight.includes('previous') ||
      lowerInsight.includes('matchup')
    ) {
      return {
        category: 'Historical Edge',
        icon: '📊',
        color: 'insight-historical',
        priority: 3,
      };
    }

    // Venue/weather insights
    if (
      lowerInsight.includes('oracle park') ||
      lowerInsight.includes('venue') ||
      lowerInsight.includes('weather') ||
      lowerInsight.includes('wind') ||
      lowerInsight.includes('conditions') ||
      lowerInsight.includes('park')
    ) {
      return {
        category: 'Venue Factor',
        icon: '🏟️',
        color: 'insight-venue',
        priority: 4,
      };
    }

    // Player-specific storylines
    if (
      lowerInsight.includes('player') ||
      lowerInsight.includes('star') ||
      lowerInsight.includes('veteran') ||
      lowerInsight.includes('rookie') ||
      lowerInsight.includes('comeback') ||
      lowerInsight.includes('milestone')
    ) {
      return {
        category: 'Player Spotlight',
        icon: '⭐',
        color: 'insight-player',
        priority: 5,
      };
    }

    // Default category
    return {
      category: 'Game Factor',
      icon: '🔍',
      color: 'insight-general',
      priority: 6,
    };
  };

  // Process and sort insights by priority
  const processedInsights = insights
    .map((insight, index) => ({
      text: insight,
      index,
      ...categorizeInsight(insight),
    }))
    .sort((a, b) => a.priority - b.priority);

  const toggleInsightExpansion = (index: number) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInsights(newExpanded);
  };

  // Extract main point and details from insight text
  const parseInsight = (text: string): { main: string; details?: string } => {
    // Check if insight has a natural break point (period, comma followed by additional info)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    if (sentences.length > 1 && sentences[0]) {
      return {
        main: sentences[0].trim() + '.',
        details: sentences.slice(1).join('. ').trim() + (sentences.slice(1).length > 0 ? '.' : ''),
      };
    }

    // If no natural break, check for comma separation
    const parts = text.split(',');
    if (parts.length > 2) {
      return {
        main: parts.slice(0, 2).join(',').trim(),
        details: parts.slice(2).join(',').trim(),
      };
    }

    return { main: text };
  };

  if (!insights || insights.length === 0) {
    return (
      <div className={`key-insights ${className}`}>
        <div className="insights-header">
          <h2>{title}</h2>
        </div>
        <div className="no-insights">
          <span className="no-insights-icon">📝</span>
          <p>No insights available for this game yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`key-insights ${className}`}>
      <div className="insights-header">
        <h2>{title}</h2>
        <div className="insights-count">
          <span className="count-badge">{insights.length}</span>
        </div>
      </div>

      <div className="insights-list">
        {processedInsights.map(insight => {
          const parsed = parseInsight(insight.text);
          const isExpanded = expandedInsights.has(insight.index);
          const hasDetails = parsed.details && expandable;

          return (
            <div key={insight.index} className={`insight-item ${insight.color}`}>
              <div className="insight-header">
                <div className="insight-category">
                  <span className="category-icon" role="img" aria-label={insight.category}>
                    {insight.icon}
                  </span>
                  <span className="category-text">{insight.category}</span>
                </div>
                <div className="insight-priority">
                  <span className={`priority-indicator priority-${insight.priority}`}>
                    {insight.priority === 1 && '🔥'}
                    {insight.priority === 2 && '⚡'}
                    {insight.priority === 3 && '📈'}
                    {insight.priority > 3 && '💡'}
                  </span>
                </div>
              </div>

              <div className="insight-content">
                <div className="insight-main">
                  <span className="insight-bullet">•</span>
                  <span className="insight-text">{parsed.main}</span>
                  {hasDetails && (
                    <button
                      className="expand-button"
                      onClick={() => toggleInsightExpansion(insight.index)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} insight details`}
                    >
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    </button>
                  )}
                </div>

                {hasDetails && isExpanded && (
                  <div className="insight-details">
                    <p>{parsed.details}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {insights.length > 3 && (
        <div className="insights-footer">
          <p className="insights-note">
            <span className="note-icon">💡</span>
            Insights are AI-generated and prioritized by impact on the game
          </p>
        </div>
      )}
    </div>
  );
};

export default KeyInsights;
