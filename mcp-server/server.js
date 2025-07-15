#!/usr/bin/env node

/**
 * SF Giants Intelligent MCP Server
 * Uses LLM analysis to generate baseball insights
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema, 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { MLBAPIClient } from "./mlb-api.js";
import { LLMAnalyzer } from "./llm-analyzer.js";
import { DataFormatter } from "./data-formatter.js";
import { ResponseParser } from "./response-parser.js";

// Server configuration
const CONFIG = {
  name: "giants-intelligent-mcp-server",
  version: "1.0.0",
  mlbApiBase: process.env.MLB_API_BASE || "https://statsapi.mlb.com/api/v1",
  userAgent: process.env.USER_AGENT || "giants-intelligent-mcp/1.0",
  giantsTeamId: parseInt(process.env.GIANTS_TEAM_ID || "137"),
  apiTimeout: parseInt(process.env.API_TIMEOUT || "10000"),
  llmProvider: process.env.LLM_PROVIDER || "anthropic", // "anthropic" or "openai"
  enableCaching: process.env.ENABLE_CACHING !== "false",
  cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || "1800000"), // 30 minutes
  logLevel: process.env.LOG_LEVEL || "info",
};

class GiantsIntelligentMCPServer {
  constructor() {
    this.server = new Server({
      name: CONFIG.name,
      version: CONFIG.version,
    }, {
      capabilities: {
        tools: {},
        resources: {},
      },
    });

    // Initialize components
    this.mlbClient = new MLBAPIClient(CONFIG.mlbApiBase, CONFIG.userAgent, CONFIG.apiTimeout);
    this.llmAnalyzer = new LLMAnalyzer(CONFIG.llmProvider);
    this.dataFormatter = new DataFormatter();
    this.responseParser = new ResponseParser();
    
    // Cache for LLM responses
    this.analysisCache = new Map();
    
    this.setupHandlers();
    this.setupLogging();
  }

  setupLogging() {
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = logLevels[CONFIG.logLevel] || 1;
    
    this.log = {
      debug: (msg, data) => currentLevel <= 0 && console.error(`[DEBUG] ${msg}`, data || ''),
      info: (msg, data) => currentLevel <= 1 && console.error(`[INFO] ${msg}`, data || ''),
      warn: (msg, data) => currentLevel <= 2 && console.error(`[WARN] ${msg}`, data || ''),
      error: (msg, data) => currentLevel <= 3 && console.error(`[ERROR] ${msg}`, data || ''),
    };
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get-giants-game-preview",
          description: "Get LLM-analyzed preview for SF Giants game on specific date",
          inputSchema: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format (defaults to today)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              includeWeather: {
                type: "boolean",
                description: "Include weather analysis in preview",
                default: true,
              },
              includeInjuries: {
                type: "boolean",
                description: "Include injury report analysis",
                default: true,
              },
              analysisDepth: {
                type: "string",
                description: "Level of analysis detail",
                enum: ["basic", "detailed", "comprehensive"],
                default: "detailed",
              },
            },
            required: [],
          },
        },
        {
          name: "analyze-pitcher-matchup",
          description: "Get LLM analysis of pitcher vs opposing team matchup",
          inputSchema: {
            type: "object",
            properties: {
              pitcherId: {
                type: "number",
                description: "MLB pitcher ID",
              },
              opposingTeamId: {
                type: "number",
                description: "Opposing team ID",
              },
              season: {
                type: "string",
                description: "Season year (YYYY)",
                default: "2024",
              },
            },
            required: ["pitcherId", "opposingTeamId"],
          },
        },
        {
          name: "get-team-momentum-analysis",
          description: "Analyze team momentum and recent performance trends",
          inputSchema: {
            type: "object",
            properties: {
              teamId: {
                type: "number",
                description: "MLB team ID (defaults to Giants)",
                default: CONFIG.giantsTeamId,
              },
              games: {
                type: "number",
                description: "Number of recent games to analyze",
                default: 10,
                minimum: 5,
                maximum: 20,
              },
            },
            required: [],
          },
        },
        {
          name: "analyze-head-to-head",
          description: "Analyze head-to-head matchup between two teams",
          inputSchema: {
            type: "object",
            properties: {
              team1Id: {
                type: "number",
                description: "First team ID (defaults to Giants)",
                default: CONFIG.giantsTeamId,
              },
              team2Id: {
                type: "number",
                description: "Second team ID",
              },
              season: {
                type: "string",
                description: "Season year (YYYY)",
                default: "2024",
              },
            },
            required: ["team2Id"],
          },
        },
        {
          name: "get-injury-impact-analysis",
          description: "Analyze how injuries affect team performance",
          inputSchema: {
            type: "object",
            properties: {
              teamId: {
                type: "number",
                description: "MLB team ID (defaults to Giants)",
                default: CONFIG.giantsTeamId,
              },
              includeMinorInjuries: {
                type: "boolean",
                description: "Include minor injury analysis",
                default: false,
              },
            },
            required: [],
          },
        },
      ],
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "giants://analysis/today",
          name: "Today's Giants Game Analysis",
          description: "LLM-powered analysis of today's Giants game",
          mimeType: "application/json",
        },
        {
          uri: "giants://analysis/recent-performance",
          name: "Recent Performance Analysis",
          description: "Analysis of Giants' recent performance trends",
          mimeType: "application/json",
        },
        {
          uri: "giants://analysis/pitching-staff",
          name: "Pitching Staff Analysis",
          description: "Comprehensive analysis of Giants pitching staff",
          mimeType: "application/json",
        },
        {
          uri: "giants://analysis/season-outlook",
          name: "Season Outlook",
          description: "LLM analysis of Giants' season prospects",
          mimeType: "application/json",
        },
      ],
    }));

    // Handle resource requests
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        let analysisResult;
        
        switch (uri) {
          case "giants://analysis/today":
            analysisResult = await this.getGiantsGamePreview();
            break;
          case "giants://analysis/recent-performance":
            analysisResult = await this.getTeamMomentumAnalysis();
            break;
          case "giants://analysis/pitching-staff":
            analysisResult = await this.getPitchingStaffAnalysis();
            break;
          case "giants://analysis/season-outlook":
            analysisResult = await this.getSeasonOutlook();
            break;
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(analysisResult, null, 2),
            },
          ],
        };
      } catch (error) {
        this.log.error(`Resource error for ${uri}:`, error);
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result;
        
        switch (name) {
          case "get-giants-game-preview":
            result = await this.getGiantsGamePreview(args.date, args);
            break;
          case "analyze-pitcher-matchup":
            result = await this.analyzePitcherMatchup(args);
            break;
          case "get-team-momentum-analysis":
            result = await this.getTeamMomentumAnalysis(args);
            break;
          case "analyze-head-to-head":
            result = await this.analyzeHeadToHead(args);
            break;
          case "get-injury-impact-analysis":
            result = await this.getInjuryImpactAnalysis(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        this.log.error(`Tool error for ${name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  // Primary function: Get LLM-analyzed Giants game preview
  async getGiantsGamePreview(date = null, options = {}) {
    const gameDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `game-preview-${gameDate}-${JSON.stringify(options)}`;
    
    // Check cache first
    if (CONFIG.enableCaching && this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.cacheTimeout) {
        this.log.debug(`Cache hit for game preview: ${gameDate}`);
        return { ...cached.data, fromCache: true };
      }
    }

    this.log.info(`Generating game preview for ${gameDate}`);
    
    try {
      // 1. Fetch comprehensive MLB data
      const rawData = await this.fetchComprehensiveGameData(gameDate);
      
      if (!rawData.gameFound) {
        return {
          success: false,
          error: "No Giants game found for the specified date",
          date: gameDate,
        };
      }

      // 2. Format data for LLM analysis
      const formattedData = this.dataFormatter.formatGameData(rawData, options);
      
      // 3. Get LLM analysis
      const analysis = await this.llmAnalyzer.analyzeGameData(formattedData, options);
      
      // 4. Parse and structure response
      const parsedResponse = this.responseParser.parseGameAnalysis(analysis);
      
      // 5. Combine with raw data
      const result = {
        success: true,
        date: gameDate,
        game: rawData.game,
        analysis: parsedResponse,
        metadata: {
          analysisGenerated: new Date().toISOString(),
          llmProvider: CONFIG.llmProvider,
          dataPoints: Object.keys(rawData).length,
        },
      };

      // Cache result
      if (CONFIG.enableCaching) {
        this.analysisCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      this.log.error(`Error generating game preview:`, error);
      return {
        success: false,
        error: error.message,
        date: gameDate,
      };
    }
  }

  // Fetch comprehensive MLB data for analysis
  async fetchComprehensiveGameData(date) {
    const data = {};
    
    try {
      // Get Giants game for the date
      const schedule = await this.mlbClient.getTeamSchedule(CONFIG.giantsTeamId, date, date);
      
      if (!schedule || !schedule.dates || schedule.dates.length === 0) {
        return { gameFound: false };
      }

      const game = schedule.dates[0].games[0];
      if (!game) {
        return { gameFound: false };
      }

      data.gameFound = true;
      data.game = game;
      data.homeTeam = game.teams.home.team;
      data.awayTeam = game.teams.away.team;
      data.venue = game.venue;
      
      // Determine opponent
      const opponent = game.teams.home.team.id === CONFIG.giantsTeamId 
        ? game.teams.away.team 
        : game.teams.home.team;
      
      data.opponent = opponent;
      data.isHomeGame = game.teams.home.team.id === CONFIG.giantsTeamId;

      // Fetch parallel data
      const [
        giantsStats,
        opponentStats,
        giantsRecentGames,
        opponentRecentGames,
        headToHead,
        giantsRoster,
        opponentRoster,
      ] = await Promise.all([
        this.mlbClient.getTeamStats(CONFIG.giantsTeamId),
        this.mlbClient.getTeamStats(opponent.id),
        this.mlbClient.getRecentGames(CONFIG.giantsTeamId, 10),
        this.mlbClient.getRecentGames(opponent.id, 10),
        this.mlbClient.getHeadToHeadRecord(CONFIG.giantsTeamId, opponent.id),
        this.mlbClient.getTeamRoster(CONFIG.giantsTeamId),
        this.mlbClient.getTeamRoster(opponent.id),
      ]);

      // Add to data object
      Object.assign(data, {
        giantsStats,
        opponentStats,
        giantsRecentGames,
        opponentRecentGames,
        headToHead,
        giantsRoster,
        opponentRoster,
      });

      // Get probable pitchers if available
      const gameFeed = await this.mlbClient.getGameFeed(game.gamePk);
      if (gameFeed && gameFeed.gameData && gameFeed.gameData.probablePitchers) {
        data.probablePitchers = gameFeed.gameData.probablePitchers;
        
        // Get pitcher stats
        if (data.probablePitchers.home) {
          data.homePitcherStats = await this.mlbClient.getPlayerStats(
            data.probablePitchers.home.id, 'season'
          );
        }
        if (data.probablePitchers.away) {
          data.awayPitcherStats = await this.mlbClient.getPlayerStats(
            data.probablePitchers.away.id, 'season'
          );
        }
      }

      // Get weather if available
      try {
        data.weather = await this.mlbClient.getGameWeather(game.gamePk);
      } catch (error) {
        this.log.warn('Weather data not available:', error.message);
      }

      // Get injury reports
      try {
        data.giantsInjuries = await this.mlbClient.getInjuryReport(CONFIG.giantsTeamId);
        data.opponentInjuries = await this.mlbClient.getInjuryReport(opponent.id);
      } catch (error) {
        this.log.warn('Injury data not available:', error.message);
      }

      return data;
    } catch (error) {
      this.log.error('Error fetching comprehensive game data:', error);
      throw error;
    }
  }

  // Additional analysis methods
  async analyzePitcherMatchup(args) {
    const { pitcherId, opposingTeamId, season = "2024" } = args;
    
    try {
      const [pitcherStats, teamStats, headToHead] = await Promise.all([
        this.mlbClient.getPlayerStats(pitcherId, 'season', season),
        this.mlbClient.getTeamStats(opposingTeamId, season),
        this.mlbClient.getPitcherVsTeamStats(pitcherId, opposingTeamId, season),
      ]);

      const formattedData = this.dataFormatter.formatPitcherMatchup({
        pitcherStats,
        teamStats,
        headToHead,
        season,
      });

      const analysis = await this.llmAnalyzer.analyzePitcherMatchup(formattedData);
      
      return {
        success: true,
        analysis: this.responseParser.parsePitcherAnalysis(analysis),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log.error('Error analyzing pitcher matchup:', error);
      return { success: false, error: error.message };
    }
  }

  async getTeamMomentumAnalysis(args = {}) {
    const { teamId = CONFIG.giantsTeamId, games = 10 } = args;
    
    try {
      const [recentGames, teamStats, standings] = await Promise.all([
        this.mlbClient.getRecentGames(teamId, games),
        this.mlbClient.getTeamStats(teamId),
        this.mlbClient.getStandings(),
      ]);

      const formattedData = this.dataFormatter.formatMomentumData({
        recentGames,
        teamStats,
        standings,
        games,
      });

      const analysis = await this.llmAnalyzer.analyzeMomentum(formattedData);
      
      return {
        success: true,
        analysis: this.responseParser.parseMomentumAnalysis(analysis),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log.error('Error analyzing team momentum:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeHeadToHead(args) {
    const { team1Id = CONFIG.giantsTeamId, team2Id, season = "2024" } = args;
    
    try {
      const [headToHeadGames, team1Stats, team2Stats] = await Promise.all([
        this.mlbClient.getHeadToHeadGames(team1Id, team2Id, season),
        this.mlbClient.getTeamStats(team1Id, season),
        this.mlbClient.getTeamStats(team2Id, season),
      ]);

      const formattedData = this.dataFormatter.formatHeadToHead({
        headToHeadGames,
        team1Stats,
        team2Stats,
        season,
      });

      const analysis = await this.llmAnalyzer.analyzeHeadToHead(formattedData);
      
      return {
        success: true,
        analysis: this.responseParser.parseHeadToHeadAnalysis(analysis),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log.error('Error analyzing head-to-head:', error);
      return { success: false, error: error.message };
    }
  }

  async getInjuryImpactAnalysis(args = {}) {
    const { teamId = CONFIG.giantsTeamId, includeMinorInjuries = false } = args;
    
    try {
      const [injuryReport, roster, recentGames] = await Promise.all([
        this.mlbClient.getInjuryReport(teamId),
        this.mlbClient.getTeamRoster(teamId),
        this.mlbClient.getRecentGames(teamId, 15),
      ]);

      const formattedData = this.dataFormatter.formatInjuryData({
        injuryReport,
        roster,
        recentGames,
        includeMinorInjuries,
      });

      const analysis = await this.llmAnalyzer.analyzeInjuryImpact(formattedData);
      
      return {
        success: true,
        analysis: this.responseParser.parseInjuryAnalysis(analysis),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log.error('Error analyzing injury impact:', error);
      return { success: false, error: error.message };
    }
  }

  // Resource helper methods
  async getPitchingStaffAnalysis() {
    try {
      const [roster, stats, recentGames] = await Promise.all([
        this.mlbClient.getTeamRoster(CONFIG.giantsTeamId),
        this.mlbClient.getTeamStats(CONFIG.giantsTeamId),
        this.mlbClient.getRecentGames(CONFIG.giantsTeamId, 20),
      ]);

      const formattedData = this.dataFormatter.formatPitchingStaffData({
        roster,
        stats,
        recentGames,
      });

      const analysis = await this.llmAnalyzer.analyzePitchingStaff(formattedData);
      
      return {
        success: true,
        analysis: this.responseParser.parsePitchingStaffAnalysis(analysis),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log.error('Error analyzing pitching staff:', error);
      return { success: false, error: error.message };
    }
  }

  async getSeasonOutlook() {
    try {
      const [standings, stats, schedule, roster] = await Promise.all([
        this.mlbClient.getStandings(),
        this.mlbClient.getTeamStats(CONFIG.giantsTeamId),
        this.mlbClient.getTeamSchedule(CONFIG.giantsTeamId),
        this.mlbClient.getTeamRoster(CONFIG.giantsTeamId),
      ]);

      const formattedData = this.dataFormatter.formatSeasonOutlook({
        standings,
        stats,
        schedule,
        roster,
      });

      const analysis = await this.llmAnalyzer.analyzeSeasonOutlook(formattedData);
      
      return {
        success: true,
        analysis: this.responseParser.parseSeasonOutlook(analysis),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log.error('Error analyzing season outlook:', error);
      return { success: false, error: error.message };
    }
  }

  async start() {
    try {
      // Test LLM connection
      await this.llmAnalyzer.testConnection();
      this.log.info(`LLM connection successful (${CONFIG.llmProvider})`);
      
      // Test MLB API connection
      await this.mlbClient.healthCheck();
      this.log.info('MLB API connection successful');
      
      // Start MCP server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.log.info('SF Giants Intelligent MCP Server running on stdio');
      
    } catch (error) {
      this.log.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
async function main() {
  const server = new GiantsIntelligentMCPServer();
  await server.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

export { GiantsIntelligentMCPServer };
