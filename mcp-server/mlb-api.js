/**
 * MLB API Client - Enhanced for LLM Analysis
 * Fetches comprehensive MLB data for intelligent analysis
 */

import fetch from 'node-fetch';

export class MLBAPIClient {
  constructor(baseURL, userAgent, timeout = 10000) {
    this.baseURL = baseURL;
    this.userAgent = userAgent;
    this.timeout = timeout;
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  async makeRequest(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseURL);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const cacheKey = url.toString();
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('MLB API request timeout');
      }
      throw error;
    }
  }

  // Enhanced team schedule with additional details
  async getTeamSchedule(teamId, startDate, endDate) {
    const today = new Date();
    const params = {
      sportId: 1,
      teamId,
      startDate: startDate || today.toISOString().split('T')[0],
      endDate: endDate || today.toISOString().split('T')[0],
      hydrate: 'team,linescore,flags,liveLookin,review,broadcasts,decisions,person,probablePitcher,stats,homeRuns,previousPlay,game(content(media(epg)),tickets)',
    };

    return await this.makeRequest('/schedule', params);
  }

  // Comprehensive team statistics
  async getTeamStats(teamId, season = null) {
    const currentSeason = season || new Date().getFullYear();
    const params = {
      stats: 'season,seasonAdvanced,career,careerAdvanced',
      season: currentSeason,
      sportId: 1,
    };

    return await this.makeRequest(`/teams/${teamId}/stats`, params);
  }

  // Enhanced recent games with detailed information
  async getRecentGames(teamId, limit = 10) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    const params = {
      sportId: 1,
      teamId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      hydrate: 'team,linescore,flags,liveLookin,review,broadcasts,decisions,person,probablePitcher,stats,homeRuns',
    };

    const data = await this.makeRequest('/schedule', params);
    
    if (!data.dates) return [];
    
    return data.dates
      .flatMap(date => date.games)
      .filter(game => game.status.abstractGameState === 'Final')
      .slice(0, limit);
  }

  // Detailed game feed with live data
  async getGameFeed(gameId) {
    const params = {
      hydrate: 'game(content(media(epg)),tickets),linescore,flags,liveLookin,review,broadcasts,decisions,person,probablePitcher,stats,homeRuns,previousPlay',
    };

    return await this.makeRequest(`/game/${gameId}/feed/live`, params);
  }

  // Enhanced team roster with detailed player information
  async getTeamRoster(teamId, rosterType = 'active', season = null) {
    const currentSeason = season || new Date().getFullYear();
    const params = {
      rosterType,
      season: currentSeason,
      hydrate: 'person,stats',
    };

    return await this.makeRequest(`/teams/${teamId}/roster`, params);
  }

  // Player statistics with comprehensive data
  async getPlayerStats(playerId, stats = 'season', season = null) {
    const currentSeason = season || new Date().getFullYear();
    const params = {
      stats: `${stats},career,careerAdvanced,seasonAdvanced`,
      season: currentSeason,
      sportId: 1,
    };

    return await this.makeRequest(`/people/${playerId}/stats`, params);
  }

  // Head-to-head record between teams
  async getHeadToHeadRecord(team1Id, team2Id, season = null) {
    const currentSeason = season || new Date().getFullYear();
    const startDate = `${currentSeason}-01-01`;
    const endDate = `${currentSeason}-12-31`;

    const params = {
      sportId: 1,
      startDate,
      endDate,
      teamId: team1Id,
      opponentId: team2Id,
    };

    return await this.makeRequest('/schedule', params);
  }

  // Get head-to-head games between teams
  async getHeadToHeadGames(team1Id, team2Id, season = null) {
    const currentSeason = season || new Date().getFullYear();
    const startDate = `${currentSeason}-01-01`;
    const endDate = `${currentSeason}-12-31`;

    const params = {
      sportId: 1,
      startDate,
      endDate,
      teamId: team1Id,
      opponentId: team2Id,
      hydrate: 'team,linescore,flags,liveLookin,review,broadcasts,decisions,person,probablePitcher,stats,homeRuns',
    };

    const data = await this.makeRequest('/schedule', params);
    return data.dates ? data.dates.flatMap(date => date.games) : [];
  }

  // Pitcher vs team statistics
  async getPitcherVsTeamStats(pitcherId, teamId, season = null) {
    const currentSeason = season || new Date().getFullYear();
    const params = {
      stats: 'vsTeam',
      season: currentSeason,
      sportId: 1,
      opposingTeamId: teamId,
    };

    return await this.makeRequest(`/people/${pitcherId}/stats`, params);
  }

  // League standings
  async getStandings(leagueId = null) {
    const params = {
      sportId: 1,
      hydrate: 'team,league,division,sport,standings',
    };

    if (leagueId) {
      params.leagueId = leagueId;
    }

    return await this.makeRequest('/standings', params);
  }

  // Weather information for game
  async getGameWeather(gameId) {
    try {
      const gameFeed = await this.getGameFeed(gameId);
      if (gameFeed && gameFeed.gameData && gameFeed.gameData.weather) {
        return gameFeed.gameData.weather;
      }
      
      // Alternative: Get venue information and estimate weather
      const venue = gameFeed?.gameData?.venue;
      if (venue) {
        // This would typically integrate with a weather API
        // For now, return basic venue info
        return {
          condition: 'Unknown',
          temp: 'Unknown',
          wind: 'Unknown',
          venue: venue.name,
          location: venue.location,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Weather data not available:', error);
      return null;
    }
  }

  // Injury reports (simulated - MLB API doesn't provide this directly)
  async getInjuryReport(teamId) {
    try {
      // In a real implementation, this would fetch from injury report APIs
      // For now, return placeholder data
      return {
        teamId,
        injuries: [],
        lastUpdated: new Date().toISOString(),
        note: 'Injury data not available from MLB API',
      };
    } catch (error) {
      console.error('Injury report not available:', error);
      return { teamId, injuries: [], lastUpdated: new Date().toISOString() };
    }
  }

  // Team leaders and key players
  async getTeamLeaders(teamId, season = null) {
    const currentSeason = season || new Date().getFullYear();
    const params = {
      leaderCategories: 'homeRuns,rbi,avg,era,wins,strikeouts,saves',
      season: currentSeason,
      sportId: 1,
    };

    return await this.makeRequest(`/teams/${teamId}/leaders`, params);
  }

  // Ballpark factors (for analytical context)
  async getBallparkFactors(venueId) {
    try {
      const params = {
        hydrate: 'venue,fieldInfo,timezone',
      };

      const data = await this.makeRequest(`/venues/${venueId}`, params);
      
      // Return venue information that affects gameplay
      return {
        name: data.venues?.[0]?.name,
        location: data.venues?.[0]?.location,
        fieldInfo: data.venues?.[0]?.fieldInfo,
        timezone: data.venues?.[0]?.timeZone,
        // Would include additional ballpark factors in a real implementation
      };
    } catch (error) {
      console.error('Ballpark factors not available:', error);
      return null;
    }
  }

  // Recent transactions (trades, signings, etc.)
  async getRecentTransactions(teamId, limit = 20) {
    try {
      const params = {
        teamId,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        hydrate: 'person,transaction',
      };

      // Note: This endpoint may not exist in the public MLB API
      // In a real implementation, you'd use appropriate transaction endpoints
      return await this.makeRequest('/transactions', params);
    } catch (error) {
      console.error('Transaction data not available:', error);
      return { transactions: [] };
    }
  }

  // Streaks and trends
  async getTeamStreaks(teamId, season = null) {
    const currentSeason = season || new Date().getFullYear();
    const params = {
      stats: 'season',
      season: currentSeason,
      sportId: 1,
    };

    const data = await this.makeRequest(`/teams/${teamId}/stats`, params);
    
    // Extract streak information from team stats
    if (data.stats && data.stats.length > 0) {
      const teamStats = data.stats[0].splits[0].stat;
      return {
        currentStreak: teamStats.streak || 'Unknown',
        last10: teamStats.last10 || 'Unknown',
        home: teamStats.home || 'Unknown',
        away: teamStats.away || 'Unknown',
      };
    }
    
    return null;
  }

  // MLB news and updates (if available)
  async getTeamNews(teamId, limit = 5) {
    try {
      const params = {
        limit,
        hydrate: 'team',
      };

      // Note: This would typically integrate with MLB news APIs
      // For now, return placeholder
      return {
        articles: [],
        lastUpdated: new Date().toISOString(),
        note: 'News data not available from MLB API',
      };
    } catch (error) {
      console.error('News data not available:', error);
      return { articles: [] };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const data = await this.makeRequest('/teams/137'); // SF Giants
      return data && data.teams && data.teams.length > 0;
    } catch (error) {
      console.error('MLB API health check failed:', error);
      return false;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
