/**
 * Client-specific types
 * Re-exports shared types and adds React-specific types
 */

// Basic types for client - simplified to avoid import issues
export interface Game {
  gamePk: number;
  gameDate: string;
  teams: {
    home: {
      team: { name: string };
      leagueRecord: { wins: number; losses: number; pct: string };
    };
    away: {
      team: { name: string };
      leagueRecord: { wins: number; losses: number; pct: string };
    };
  };
  venue: { name: string };
  status: { abstractGameState: string; detailedState: string };
}

export interface GamePreview {
  game: Game;
  teams: {
    home: { name: string; leagueRecord: { wins: number; losses: number; pct: string } };
    away: { name: string; leagueRecord: { wins: number; losses: number; pct: string } };
  };
  venue: { name: string };
  weather?: { condition: string; temp: string; wind: string };
  probablePitchers?: {
    home?: {
      fullName: string;
      pitchingStats?: { era: string; whip: string; wins: number; losses: number };
    };
    away?: {
      fullName: string;
      pitchingStats?: { era: string; whip: string; wins: number; losses: number };
    };
  };
  gameNotes?: string[];
  predictions?: {
    winProbability: { home: number; away: number };
    expectedScore?: { home: number; away: number };
  };
}

// Giants-specific API response type based on backend
export interface GiantsGameData {
  game: {
    id: string;
    date: string;
    homeTeam: TeamInfo;
    awayTeam: TeamInfo;
    venue: string;
    status: string;
  };
  pitchingMatchup: {
    giants: PitcherInfo;
    opponent: PitcherInfo;
    advantage: string;
  };
  keyInsights: string[];
  lastUpdated: string;
}

export interface TeamInfo {
  name: string;
  record: string;
  city: string;
  abbreviation: string;
}

export interface PitcherInfo {
  name: string;
  era: number;
  recentForm: string;
  wins: number;
  losses: number;
  strikeouts: number;
}

export interface Team {
  id: number;
  name: string;
  league: { name: string };
  division: { name: string };
  teamStats?: { wins: number; losses: number; winningPercentage: string };
}

export interface Person {
  id: number;
  fullName: string;
}

export interface Roster {
  roster: any[];
}

export interface Schedule {
  dates: Array<{
    date: string;
    games: Game[];
  }>;
}

export interface APIResponseFormat<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface LeagueRecord {
  wins: number;
  losses: number;
  pct: string;
}

export interface Player {
  id: number;
  fullName: string;
}

export interface BattingStats {
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  avg: string;
}

export interface PitchingStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  era: string;
  whip: string;
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

export interface Venue {
  id: number;
  name: string;
}

// React-specific types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface GameCardProps extends ComponentProps {
  game: Game;
  onGameClick?: (gameId: number) => void;
}

export interface GamePreviewProps extends ComponentProps {
  gameId: number;
  onBack?: () => void;
}

export interface TeamCardProps extends ComponentProps {
  team: Team;
  record?: LeagueRecord;
  isHome?: boolean;
}

export interface PlayerCardProps extends ComponentProps {
  player: Player;
  showStats?: boolean;
  showPosition?: boolean;
}

export interface StatsDisplayProps extends ComponentProps {
  stats: BattingStats | PitchingStats;
  type: 'batting' | 'pitching';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface NavigationProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

export interface SearchProps extends ComponentProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export interface FilterOptions {
  gameType?: string;
  startDate?: string;
  endDate?: string;
  teamId?: number;
  status?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export interface APIHookOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export interface UseGamesOptions extends APIHookOptions {
  teamId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface UseGamePreviewOptions extends APIHookOptions {
  includeMatchups?: boolean;
  includePredictions?: boolean;
  includeWeather?: boolean;
}

export interface UseRosterOptions extends APIHookOptions {
  teamId?: number;
  rosterType?: string;
  season?: string;
}

export interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Custom hook interface for useGameData
export interface UseGameDataReturn {
  data: GiantsGameData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => void;
  lastUpdated: Date | null;
}

// Component props for new components
export interface LoadingStateProps extends ComponentProps {
  message?: string;
  showProgress?: boolean;
}

export interface ErrorStateProps extends ComponentProps {
  error: string;
  onRetry: () => void;
  retrying?: boolean;
  showContact?: boolean;
}

export interface PitchingMatchupProps extends ComponentProps {
  matchup: {
    giants: PitcherInfo;
    opponent: PitcherInfo;
    advantage: string;
  };
}

export interface KeyInsightsProps extends ComponentProps {
  insights: string[];
  title?: string;
  expandable?: boolean;
}

export interface GamePreviewCardProps extends ComponentProps {
  gameData: GiantsGameData;
  lastUpdated?: Date | null;
}

export interface GamePreviewState {
  game: GamePreview | null;
  loading: boolean;
  error: string | null;
}

export interface GamesState {
  games: Game[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface RosterState {
  roster: Roster | null;
  loading: boolean;
  error: string | null;
}

export interface AppState {
  games: GamesState;
  gamePreview: GamePreviewState;
  roster: RosterState;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  duration?: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    h1: string;
    h2: string;
    h3: string;
    body: string;
    caption: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  title?: string;
}

export interface AppConfig {
  apiUrl: string;
  giantsTeamId: number;
  refreshInterval: number;
  theme: Theme;
}

export interface LocalStorageData {
  favoriteGames: number[];
  preferredView: 'list' | 'grid';
  theme: 'light' | 'dark';
  lastVisited: string;
}

export interface GameStatusColors {
  [key: string]: string;
}

export interface WeatherIconProps {
  condition: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface FormattedDateProps {
  date: string | Date;
  format?: 'short' | 'long' | 'time' | 'datetime';
  timezone?: string;
}

export interface EmptyStateProps extends ComponentProps {
  title: string;
  message: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface LoadingSpinnerProps extends ComponentProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export interface ModalProps extends ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export interface GameActionsProps {
  gameId: number;
  isFavorite: boolean;
  onToggleFavorite: (gameId: number) => void;
  onShare?: (gameId: number) => void;
}

export interface StatsComparison {
  home: any;
  away: any;
  advantage: 'home' | 'away' | 'even';
}

export interface MatchupCardProps extends ComponentProps {
  matchup: MatchupAnalysis;
  batter: Player;
  pitcher: Player;
}

export interface PredictionsCardProps extends ComponentProps {
  predictions: any;
  homeTeam: Team;
  awayTeam: Team;
}

export interface WeatherCardProps extends ComponentProps {
  weather: any;
  venue: Venue;
}

export interface GameTimelineProps extends ComponentProps {
  games: Game[];
  selectedGameId?: number;
  onGameSelect: (gameId: number) => void;
}

export interface TeamStatsProps extends ComponentProps {
  teamId: number;
  season?: string;
  compact?: boolean;
}

export interface PlayerListProps extends ComponentProps {
  players: Player[];
  onPlayerClick?: (playerId: number) => void;
  showStats?: boolean;
  groupBy?: 'position' | 'none';
}

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export interface VirtualizedListProps<T> extends ComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface InfiniteScrollProps extends ComponentProps {
  hasMore: boolean;
  loadMore: () => void;
  loading: boolean;
  threshold?: number;
}

export interface SkeletonProps extends ComponentProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
}

export interface KeyboardShortcutProps {
  keys: string[];
  onTrigger: () => void;
  description: string;
  enabled?: boolean;
}

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}
