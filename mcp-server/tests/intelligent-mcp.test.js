import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockConnect = jest.fn();

class MockMLBAPIClient {
  constructor() {}
  healthCheck = jest.fn().mockResolvedValue(true);
  getTeamSchedule = jest.fn().mockResolvedValue({
    dates: [
      {
        games: [
          {
            gamePk: 1,
            gameDate: '2024-05-01T00:00:00Z',
            venue: { name: 'Oracle Park' },
            teams: {
              home: {
                team: { id: 137, name: 'SF Giants' },
                score: 3,
                leagueRecord: { wins: 10, losses: 8 }
              },
              away: {
                team: { id: 138, name: 'Dodgers' },
                score: 5,
                leagueRecord: { wins: 11, losses: 7 }
              }
            },
            gameType: 'R',
            gameNumber: 1,
            gamesInSeries: 3,
            seriesGameNumber: 1,
            seriesDescription: 'Regular Season'
          }
        ]
      }
    ]
  });
  getTeamStats = jest.fn().mockResolvedValue({ stats: [{ splits: [{ stat: { wins: 10, losses: 8, winPercentage: '0.556' } }] }] });
  getRecentGames = jest.fn().mockResolvedValue([
    { teams: { home: { team: { id: 137 }, score: 4 }, away: { team: { id: 138 }, score: 2 } } },
    { teams: { home: { team: { id: 138 }, score: 3 }, away: { team: { id: 137 }, score: 5 } } }
  ]);
  getHeadToHeadRecord = jest.fn().mockResolvedValue({ dates: [] });
  getTeamRoster = jest.fn().mockResolvedValue([]);
  getGameFeed = jest.fn().mockResolvedValue({});
  getPlayerStats = jest.fn().mockResolvedValue({});
  getGameWeather = jest.fn().mockResolvedValue(null);
  getInjuryReport = jest.fn().mockResolvedValue([]);
}

class MockLLMAnalyzer {
  constructor() {}
  testConnection = jest.fn().mockResolvedValue(true);
  getUsageStats = jest.fn().mockReturnValue({ provider: 'mock', model: 'mock', requestCount: 0, totalCost: 0 });
}

jest.unstable_mockModule('../mlb-api.js', () => ({
  MLBAPIClient: jest.fn().mockImplementation(() => new MockMLBAPIClient())
}));

jest.unstable_mockModule('../llm-analyzer.js', () => ({
  LLMAnalyzer: jest.fn().mockImplementation(() => new MockLLMAnalyzer())
}));

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    setRequestHandler: jest.fn()
  }))
}));

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn()
}));

const { GiantsIntelligentMCPServer } = await import('../server.js');

describe('GiantsIntelligentMCPServer', () => {
  let server;

  beforeEach(() => {
    server = new GiantsIntelligentMCPServer();
    mockConnect.mockClear();
  });

  it('starts successfully', async () => {
    await server.start();
    expect(mockConnect).toHaveBeenCalled();
  });

  it('fetches and formats game data', async () => {
    const raw = await server.fetchComprehensiveGameData('2024-05-01');
    expect(raw.gameFound).toBe(true);
    const formatted = server.dataFormatter.formatGameData(raw);
    expect(formatted).toHaveProperty('gameContext');
    expect(formatted).toHaveProperty('teamStats');
  });
});
