/**
 * API client for communicating with the Express backend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Game,
  GamePreview,
  Team,
  Roster,
  Person,
  Schedule,
  APIResponseFormat,
  GiantsGameData,
} from './types';

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: `${this.baseURL}/api`,
      timeout: 8000, // 8 seconds as specified in requirements
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      config => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      response => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      error => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async handleResponse<T>(
    promise: Promise<AxiosResponse<APIResponseFormat<T>>>
  ): Promise<T> {
    try {
      const response = await promise;

      if (response.data.success) {
        return response.data.data as T;
      } else {
        throw new Error(response.data.error || 'Unknown error occurred');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        } else if (error.response?.status === 404) {
          throw new Error('Resource not found');
        } else if (error.response?.status === 500) {
          throw new Error('Server error occurred');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout');
        }
      }

      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error occurred');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 3s
        const delay = baseDelay * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private normalizeErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        return error.response.data.error;
      } else if (error.response?.status === 404) {
        return 'No upcoming Giants game found';
      } else if (error.response?.status === 500) {
        return 'Server temporarily unavailable';
      } else if (error.response?.status === 503) {
        return 'Service temporarily unavailable';
      } else if (error.code === 'ECONNABORTED') {
        return 'Request timed out';
      } else if (error.code === 'ECONNREFUSED') {
        return 'Unable to connect to server';
      }
    }

    return error instanceof Error ? error.message : 'An unexpected error occurred';
  }

  private validateResponseData(data: any, expectedKeys: string[]): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    return expectedKeys.every(key => key in data);
  }

  // Giants-specific API call
  async getGiantsNextGame(): Promise<GiantsGameData> {
    return this.retryWithBackoff(async () => {
      try {
        const response =
          await this.client.get<APIResponseFormat<GiantsGameData>>('/giants/next-game');

        if (response.data.success && response.data.data) {
          const gameData = response.data.data;

          // Validate response structure
          const requiredKeys = ['game', 'pitchingMatchup', 'keyInsights', 'lastUpdated'];
          if (!this.validateResponseData(gameData, requiredKeys)) {
            throw new Error('Invalid response format from server');
          }

          return gameData;
        } else {
          throw new Error(response.data.error || 'Failed to fetch Giants game data');
        }
      } catch (error) {
        throw new Error(this.normalizeErrorMessage(error));
      }
    });
  }

  // Game-related API calls
  async getUpcomingGames(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
    gameType?: string;
  }): Promise<Game[]> {
    return this.handleResponse(
      this.client.get<APIResponseFormat<Game[]>>('/games/upcoming', { params })
    );
  }

  async getGamePreview(
    gameId: number,
    params?: {
      includeMatchups?: boolean;
      includePredictions?: boolean;
      includeWeather?: boolean;
      includeStats?: boolean;
    }
  ): Promise<GamePreview> {
    return this.handleResponse(
      this.client.get<APIResponseFormat<GamePreview>>(`/games/${gameId}/preview`, { params })
    );
  }

  async getGameBoxScore(gameId: number): Promise<any> {
    return this.handleResponse(
      this.client.get<APIResponseFormat<any>>(`/games/${gameId}/boxscore`)
    );
  }

  // Team-related API calls
  async getTeamInfo(teamId: number): Promise<Team> {
    return this.handleResponse(this.client.get<APIResponseFormat<Team>>(`/teams/${teamId}`));
  }

  async getTeamRoster(params?: {
    teamId?: number;
    rosterType?: string;
    season?: string;
  }): Promise<Roster> {
    return this.handleResponse(
      this.client.get<APIResponseFormat<Roster>>('/teams/roster', { params })
    );
  }

  async getSchedule(params?: {
    teamId?: number;
    startDate?: string;
    endDate?: string;
    gameType?: string;
    limit?: number;
  }): Promise<Schedule> {
    return this.handleResponse(
      this.client.get<APIResponseFormat<Schedule>>('/schedule', { params })
    );
  }

  // Player-related API calls
  async getPlayerInfo(playerId: number): Promise<Person> {
    return this.handleResponse(this.client.get<APIResponseFormat<Person>>(`/players/${playerId}`));
  }

  async getPlayerStats(
    playerId: number,
    params?: {
      stats?: string;
      season?: string;
      gameType?: string;
    }
  ): Promise<any> {
    return this.handleResponse(
      this.client.get<APIResponseFormat<any>>(`/players/${playerId}/stats`, { params })
    );
  }

  async searchPlayers(params: { q: string; limit?: number }): Promise<Person[]> {
    return this.handleResponse(
      this.client.get<APIResponseFormat<Person[]>>('/players/search', { params })
    );
  }

  // Standings
  async getStandings(params?: { leagueId?: number; divisionId?: number }): Promise<any> {
    return this.handleResponse(this.client.get<APIResponseFormat<any>>('/standings', { params }));
  }

  // Utility methods
  async healthCheck(): Promise<any> {
    return this.handleResponse(this.client.get<APIResponseFormat<any>>('/health'));
  }

  async getCacheStats(): Promise<any> {
    return this.handleResponse(this.client.get<APIResponseFormat<any>>('/cache/stats'));
  }

  async clearCache(): Promise<any> {
    return this.handleResponse(this.client.delete<APIResponseFormat<any>>('/cache'));
  }
}

export const apiClient = new APIClient();

// React hooks for API calls
export const useAPI = () => {
  return {
    giants: {
      getNextGame: apiClient.getGiantsNextGame.bind(apiClient),
    },
    games: {
      getUpcoming: apiClient.getUpcomingGames.bind(apiClient),
      getPreview: apiClient.getGamePreview.bind(apiClient),
      getBoxScore: apiClient.getGameBoxScore.bind(apiClient),
    },
    teams: {
      getInfo: apiClient.getTeamInfo.bind(apiClient),
      getRoster: apiClient.getTeamRoster.bind(apiClient),
      getSchedule: apiClient.getSchedule.bind(apiClient),
    },
    players: {
      getInfo: apiClient.getPlayerInfo.bind(apiClient),
      getStats: apiClient.getPlayerStats.bind(apiClient),
      search: apiClient.searchPlayers.bind(apiClient),
    },
    standings: {
      get: apiClient.getStandings.bind(apiClient),
    },
    util: {
      healthCheck: apiClient.healthCheck.bind(apiClient),
      getCacheStats: apiClient.getCacheStats.bind(apiClient),
      clearCache: apiClient.clearCache.bind(apiClient),
    },
  };
};

export default apiClient;
