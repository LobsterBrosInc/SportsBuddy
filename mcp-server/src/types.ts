/**
 * Types for MCP Server
 * Basic types for MCP server functionality
 */

// Basic types
export interface Game {
  gamePk: number;
  gameDate: string;
  teams: {
    home: any;
    away: any;
  };
  venue: any;
  status: any;
}

export interface Schedule {
  dates: Array<{
    date: string;
    games: Game[];
  }>;
}

export interface Team {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  fullName: string;
}

export interface Roster {
  roster: any[];
}

export interface MatchupAnalysis {
  batterVsPitcher: any;
  pitcherVsBatter: any;
  historicalPerformance: any;
}

export interface GamePreview {
  game: Game;
  teams: any;
  venue: any;
  weather?: any;
}

// MCP-specific types
export interface MCPServerConfig {
  name: string;
  version: string;
  mlbApiBase: string;
  userAgent: string;
  giantsTeamId: number;
  apiTimeout: number;
}

export interface APIError {
  message: string;
  code?: string;
  timestamp: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface AnalyticsConfig {
  enablePredictions: boolean;
  enableMatchupAnalysis: boolean;
  enableTrendAnalysis: boolean;
  cacheTimeout: number;
}

export interface WeatherData {
  condition: string;
  temperature: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  precipitation: number;
}

export interface GameContext {
  season: string;
  gameType: string;
  dayNight: string;
  venue: {
    id: number;
    name: string;
    city: string;
    state: string;
  };
  weather?: WeatherData;
  attendance?: number;
  gameTime: string;
}

export interface TeamTrend {
  wins: number;
  losses: number;
  streak: string;
  last10: string;
  momentum: number;
  form: "excellent" | "good" | "average" | "poor" | "terrible";
}

export interface PitcherAnalysis {
  recentForm: string;
  averageInnings: number;
  strikeoutRate: number;
  walkRate: number;
  homeRunRate: number;
  groundBallRate: number;
  trend: string;
  effectiveness: number;
}

export interface OffensiveAnalysis {
  runsPerGame: number;
  battingAverage: string;
  onBasePercentage: string;
  sluggingPercentage: string;
  homeRuns: number;
  stolenBases: number;
  trend: string;
}

export interface DefensiveAnalysis {
  fieldingPercentage: string;
  errors: number;
  doublePlays: number;
  saves: number;
  earnedRunAverage: number;
  whip: number;
  trend: string;
}

export interface GameInsights {
  keyMatchups: string[];
  weatherImpact: string;
  venueFactors: string[];
  injuries: string[];
  trends: string[];
  prediction: string;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface MCPResourceData {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  data: any;
  lastUpdated: string;
}
