// Shared TypeScript interfaces for SF Giants Preview App

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  teamName: string;
  locationName: string;
  firstYearOfPlay: string;
  league: {
    id: number;
    name: string;
  };
  division: {
    id: number;
    name: string;
  };
  venue: {
    id: number;
    name: string;
  };
  teamStats?: {
    wins: number;
    losses: number;
    winningPercentage: string;
  };
}

export interface LeagueRecord {
  wins: number;
  losses: number;
  pct: string;
}

export interface Venue {
  id: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface GameStatus {
  abstractGameState: string;
  codedGameState: string;
  detailedState: string;
  statusCode: string;
  startTimeTBD: boolean;
}

export interface GameTeam {
  leagueRecord: LeagueRecord;
  score?: number;
  team: Team;
  isWinner?: boolean;
  splitSquad?: boolean;
  seriesNumber?: number;
}

export interface Game {
  gamePk: number;
  link: string;
  gameType: string;
  season: string;
  gameDate: string;
  originalDate?: string;
  officialDate: string;
  status: GameStatus;
  teams: {
    away: GameTeam;
    home: GameTeam;
  };
  venue: Venue;
  isTie?: boolean;
  gameNumber: number;
  publicFacing: boolean;
  doubleHeader: string;
  gamedayType: string;
  tiebreaker: string;
  calendarEventID: string;
  seasonDisplay: string;
  dayNight: string;
  scheduledInnings: number;
  reverseHomeAwayStatus: boolean;
  inningBreakLength: number;
  gamesInSeries: number;
  seriesGameNumber: number;
  seriesDescription: string;
  recordSource: string;
  ifNecessary: string;
  ifNecessaryDescription: string;
}

export interface Person {
  id: number;
  fullName: string;
  link: string;
  firstName: string;
  lastName: string;
  primaryNumber?: string;
  birthDate?: string;
  currentAge?: number;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  active?: boolean;
  primaryPosition?: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  useName?: string;
  useLastName?: string;
  middleName?: string;
  boxscoreName?: string;
  nickName?: string;
  mlbDebutDate?: string;
  batSide?: {
    code: string;
    description: string;
  };
  pitchHand?: {
    code: string;
    description: string;
  };
  nameFirstLast?: string;
  nameSlug?: string;
  firstLastName?: string;
  lastFirstName?: string;
  lastInitName?: string;
  initLastName?: string;
  fullFMLName?: string;
  fullLFMName?: string;
}

export interface Player extends Person {
  jerseyNumber?: string;
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  status: {
    code: string;
    description: string;
  };
  parentTeamId?: number;
}

export interface PitchingStats {
  gamesPlayed: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  era: string;
  whip: string;
  strikeOuts: number;
  baseOnBalls: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  homeRuns: number;
  inningsPitched: string;
  pitchesThrown?: number;
  strikes?: number;
  groundOuts?: number;
  airOuts?: number;
  saveOpportunities?: number;
  saves?: number;
  holds?: number;
  blownSaves?: number;
  qualityStarts?: number;
  completeGames?: number;
  shutouts?: number;
}

export interface BattingStats {
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  baseOnBalls: number;
  strikeOuts: number;
  stolenBases: number;
  caughtStealing: number;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
  plateAppearances?: number;
  totalBases?: number;
  groundOuts?: number;
  flyOuts?: number;
  sacBunts?: number;
  sacFlies?: number;
  hitByPitch?: number;
  intentionalWalks?: number;
  leftOnBase?: number;
}

export interface Pitcher extends Player {
  pitchingStats?: PitchingStats;
  seasonStats?: PitchingStats;
}

export interface Batter extends Player {
  battingStats?: BattingStats;
  seasonStats?: BattingStats;
}

export interface MatchupAnalysis {
  batterVsPitcher: {
    atBats: number;
    hits: number;
    avg: string;
    homeRuns: number;
    rbi: number;
  };
  pitcherVsBatter: {
    plateAppearances: number;
    strikeOuts: number;
    walks: number;
    era: string;
  };
  historicalPerformance: {
    last10Games: any[];
    seasonTrend: string;
  };
}

export interface GamePreview {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  probablePitchers: {
    home?: Pitcher;
    away?: Pitcher;
  };
  keyMatchups: MatchupAnalysis[];
  teamStats: {
    home: {
      record: LeagueRecord;
      recentForm: string;
      keyPlayers: Player[];
    };
    away: {
      record: LeagueRecord;
      recentForm: string;
      keyPlayers: Player[];
    };
  };
  gameNotes: string[];
  weather?: {
    condition: string;
    temp: string;
    wind: string;
  };
  predictions?: {
    winProbability: {
      home: number;
      away: number;
    };
    expectedScore: {
      home: number;
      away: number;
    };
  };
}

export interface Schedule {
  copyright: string;
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalGamesInProgress: number;
  dates: {
    date: string;
    totalItems: number;
    totalEvents: number;
    totalGames: number;
    totalGamesInProgress: number;
    games: Game[];
    events: any[];
  }[];
}

export interface RosterEntry {
  person: Person;
  jerseyNumber: string;
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  status: {
    code: string;
    description: string;
  };
  parentTeamId?: number;
}

export interface Roster {
  copyright: string;
  roster: RosterEntry[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

// MCP Server Types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  mlbApiBase: string;
  userAgent: string;
  giantsTeamId: number;
  apiTimeout: number;
}

// Request/Response Types for Express API
export interface GetUpcomingGamesRequest {
  teamId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface GetGamePreviewRequest {
  gameId: number;
  includeMatchups?: boolean;
  includePredictions?: boolean;
}

export interface GetRosterRequest {
  teamId?: number;
  rosterType?: string;
  season?: string;
}
