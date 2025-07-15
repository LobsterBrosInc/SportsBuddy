/**
 * MLB API Client
 * Handles all interactions with the MLB Stats API
 */

import { Schedule, Game, Roster, Team, Person } from "./types";

export class MLBAPIClient {
  private baseURL: string;
  private userAgent: string;
  private timeout: number;

  constructor(baseURL: string, userAgent: string, timeout: number = 5000) {
    this.baseURL = baseURL;
    this.userAgent = userAgent;
    this.timeout = timeout;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers = {
      "User-Agent": this.userAgent,
      "Accept": "application/json",
      ...(options?.headers || {}),
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`MLB API error: ${response.status} ${response.statusText} for ${endpoint}`);
        return null;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`MLB API timeout for ${endpoint}`);
      } else {
        console.error(`MLB API network error for ${endpoint}:`, error);
      }
      
      return null;
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo(teamId: number): Promise<Team | null> {
    const response = await this.fetch<{ teams: Team[] }>(`/teams/${teamId}`);
    return response?.teams?.[0] || null;
  }

  /**
   * Get team schedule
   */
  async getTeamSchedule(
    teamId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Schedule | null> {
    const params = new URLSearchParams({
      sportId: "1",
      teamId: teamId.toString(),
    });

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    // Default to next 30 days if no dates provided
    if (!startDate && !endDate) {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      params.append("startDate", today.toISOString().split('T')[0]);
      params.append("endDate", futureDate.toISOString().split('T')[0]);
    }

    return await this.fetch<Schedule>(`/schedule?${params}`);
  }

  /**
   * Get team roster
   */
  async getTeamRoster(
    teamId: number,
    rosterType: string = "active",
    season?: string
  ): Promise<Roster | null> {
    const params = new URLSearchParams({
      rosterType,
    });

    if (season) params.append("season", season);

    return await this.fetch<Roster>(`/teams/${teamId}/roster?${params}`);
  }

  /**
   * Get game feed with detailed information
   */
  async getGameFeed(gameId: number): Promise<Game | null> {
    const response = await this.fetch<{ gameData: Game }>(`/game/${gameId}/feed/live`);
    return response?.gameData || null;
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(
    playerId: number,
    stats: string = "season",
    season?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      stats,
    });

    if (season) params.append("season", season);

    return await this.fetch(`/people/${playerId}/stats?${params}`);
  }

  /**
   * Get person information
   */
  async getPersonInfo(personId: number): Promise<Person | null> {
    const response = await this.fetch<{ people: Person[] }>(`/people/${personId}`);
    return response?.people?.[0] || null;
  }

  /**
   * Get upcoming games for a team
   */
  async getUpcomingGames(
    teamId: number,
    limit: number = 10
  ): Promise<Game[]> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 60);

    const schedule = await this.getTeamSchedule(
      teamId,
      today.toISOString().split('T')[0],
      futureDate.toISOString().split('T')[0]
    );

    if (!schedule?.dates) return [];

    return schedule.dates
      .flatMap(date => date.games)
      .filter(game => game.status.abstractGameState === "Preview")
      .slice(0, limit);
  }

  /**
   * Get recent games for a team
   */
  async getRecentGames(
    teamId: number,
    limit: number = 10
  ): Promise<Game[]> {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 30);

    const schedule = await this.getTeamSchedule(
      teamId,
      pastDate.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );

    if (!schedule?.dates) return [];

    return schedule.dates
      .flatMap(date => date.games)
      .filter(game => game.status.abstractGameState === "Final")
      .slice(0, limit);
  }

  /**
   * Get team stats
   */
  async getTeamStats(teamId: number, season?: string): Promise<any> {
    const params = new URLSearchParams({
      stats: "season",
    });

    if (season) params.append("season", season);

    return await this.fetch(`/teams/${teamId}/stats?${params}`);
  }

  /**
   * Get standings for a league/division
   */
  async getStandings(leagueId?: number, divisionId?: number): Promise<any> {
    const params = new URLSearchParams();

    if (leagueId) params.append("leagueId", leagueId.toString());
    if (divisionId) params.append("divisionId", divisionId.toString());

    return await this.fetch(`/standings?${params}`);
  }

  /**
   * Search for players
   */
  async searchPlayers(query: string): Promise<Person[]> {
    const params = new URLSearchParams({
      names: query,
    });

    const response = await this.fetch<{ people: Person[] }>(`/people/search?${params}`);
    return response?.people || [];
  }

  /**
   * Get game box score
   */
  async getGameBoxScore(gameId: number): Promise<any> {
    return await this.fetch(`/game/${gameId}/boxscore`);
  }

  /**
   * Get game play by play
   */
  async getGamePlayByPlay(gameId: number): Promise<any> {
    return await this.fetch(`/game/${gameId}/playByPlay`);
  }

  /**
   * Get game weather information
   */
  async getGameWeather(gameId: number): Promise<any> {
    const gameFeed = await this.getGameFeed(gameId);
    return gameFeed ? {
      venue: gameFeed.venue,
      // Weather data would typically be in the live game feed
      weather: null, // MLB API doesn't provide weather directly
    } : null;
  }

  /**
   * Get probable pitchers for a game
   */
  async getProbablePitchers(gameId: number): Promise<any> {
    const gameFeed = await this.getGameFeed(gameId);
    return gameFeed ? {
      home: null, // Would extract from game feed
      away: null, // Would extract from game feed
    } : null;
  }

  /**
   * Get league information
   */
  async getLeagues(): Promise<any> {
    return await this.fetch(`/leagues`);
  }

  /**
   * Get division information
   */
  async getDivisions(): Promise<any> {
    return await this.fetch(`/divisions`);
  }

  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    const response = await this.fetch<{ teams: Team[] }>(`/teams`);
    return response?.teams || [];
  }

  /**
   * Get venue information
   */
  async getVenue(venueId: number): Promise<any> {
    return await this.fetch(`/venues/${venueId}`);
  }

  /**
   * Get season information
   */
  async getSeason(seasonId: string): Promise<any> {
    return await this.fetch(`/seasons/${seasonId}`);
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetch<any>(`/teams/137`);
      return response !== null;
    } catch {
      return false;
    }
  }
}
