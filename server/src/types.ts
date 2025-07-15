// TypeScript interfaces for API contracts

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    correlationId: string;
  };
  timestamp: string;
}

export interface GameInfo {
  id: string;
  date: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  venue: string;
  status?: string;
}

export interface TeamInfo {
  name: string;
  record: string;
  city?: string;
  abbreviation?: string;
}

export interface PitcherInfo {
  name: string;
  era: number;
  recentForm: string;
  wins?: number;
  losses?: number;
  strikeouts?: number;
}

export interface PitchingMatchup {
  giants: PitcherInfo;
  opponent: PitcherInfo;
  advantage: string;
}

export interface GamePreviewData {
  game: GameInfo;
  pitchingMatchup: PitchingMatchup;
  keyInsights: string[];
  lastUpdated: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    mcpServer: 'connected' | 'disconnected' | 'error';
    database: 'not applicable';
  };
  uptime: number;
}

export interface McpServerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface RequestContext {
  correlationId: string;
  startTime: number;
  method: string;
  url: string;
  userAgent?: string | undefined;
  ip: string;
}

export interface LogContext {
  correlationId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: Error | string | unknown;
  [key: string]: any;
}

// Error types
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public correlationId?: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class McpCommunicationError extends ApiError {
  constructor(message: string, correlationId?: string) {
    super(message, 500, 'MCP_COMMUNICATION_ERROR');
    if (correlationId !== undefined) {
      this.correlationId = correlationId;
    }
  }
}

export class GameNotFoundError extends ApiError {
  constructor(correlationId?: string) {
    super('No upcoming Giants game found', 404, 'GAME_NOT_FOUND');
    if (correlationId !== undefined) {
      this.correlationId = correlationId;
    }
  }
}

export class TimeoutError extends ApiError {
  constructor(correlationId?: string) {
    super('Request timeout exceeded', 408, 'REQUEST_TIMEOUT');
    if (correlationId !== undefined) {
      this.correlationId = correlationId;
    }
  }
}
