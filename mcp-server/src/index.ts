#!/usr/bin/env node

/**
 * SF Giants MCP Server
 * Provides MLB data integration for the Giants Preview App
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
// import { z } from "zod";
import { MLBAPIClient } from "./mlb-api";
import { AnalyticsEngine } from "./analytics";
import { MCPServerConfig } from "./types";

const CONFIG: MCPServerConfig = {
  name: "giants-mcp-server",
  version: "1.0.0",
  mlbApiBase: process.env.MLB_API_BASE || "https://statsapi.mlb.com/api/v1",
  userAgent: process.env.USER_AGENT || "giants-app/1.0",
  giantsTeamId: parseInt(process.env.GIANTS_TEAM_ID || "137"),
  apiTimeout: parseInt(process.env.API_TIMEOUT || "5000"),
};

class GiantsMCPServer {
  private server: Server;
  private mlbClient: MLBAPIClient;
  private analytics: AnalyticsEngine;

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

    this.mlbClient = new MLBAPIClient(CONFIG.mlbApiBase, CONFIG.userAgent, CONFIG.apiTimeout);
    this.analytics = new AnalyticsEngine();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get-team-schedule",
          description: "Get upcoming games for a team",
          inputSchema: {
            type: "object",
            properties: {
              teamId: {
                type: "number",
                description: "MLB team ID (Giants: 137)",
                default: CONFIG.giantsTeamId,
              },
              startDate: {
                type: "string",
                description: "Start date (YYYY-MM-DD)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              endDate: {
                type: "string",
                description: "End date (YYYY-MM-DD)",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              limit: {
                type: "number",
                description: "Maximum number of games to return",
                default: 10,
                minimum: 1,
                maximum: 50,
              },
            },
            required: [],
          },
        },
        {
          name: "get-game-preview",
          description: "Get detailed preview for a specific game",
          inputSchema: {
            type: "object",
            properties: {
              gameId: {
                type: "number",
                description: "MLB game ID",
              },
              includeMatchups: {
                type: "boolean",
                description: "Include detailed matchup analysis",
                default: true,
              },
              includePredictions: {
                type: "boolean",
                description: "Include game predictions",
                default: false,
              },
            },
            required: ["gameId"],
          },
        },
        {
          name: "get-team-roster",
          description: "Get current team roster",
          inputSchema: {
            type: "object",
            properties: {
              teamId: {
                type: "number",
                description: "MLB team ID (Giants: 137)",
                default: CONFIG.giantsTeamId,
              },
              rosterType: {
                type: "string",
                description: "Type of roster to retrieve",
                enum: ["active", "40Man", "fullSeason"],
                default: "active",
              },
              season: {
                type: "string",
                description: "Season year (YYYY)",
                pattern: "^\\d{4}$",
              },
            },
            required: [],
          },
        },
        {
          name: "get-player-stats",
          description: "Get player statistics",
          inputSchema: {
            type: "object",
            properties: {
              playerId: {
                type: "number",
                description: "MLB player ID",
              },
              stats: {
                type: "string",
                description: "Type of stats to retrieve",
                enum: ["season", "career", "lastXGames", "vsTeam"],
                default: "season",
              },
              season: {
                type: "string",
                description: "Season year (YYYY)",
                pattern: "^\\d{4}$",
              },
            },
            required: ["playerId"],
          },
        },
        {
          name: "analyze-matchup",
          description: "Analyze batter vs pitcher matchup",
          inputSchema: {
            type: "object",
            properties: {
              batterId: {
                type: "number",
                description: "MLB batter ID",
              },
              pitcherId: {
                type: "number",
                description: "MLB pitcher ID",
              },
              season: {
                type: "string",
                description: "Season year (YYYY)",
                pattern: "^\\d{4}$",
              },
            },
            required: ["batterId", "pitcherId"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "team://giants/info",
          name: "SF Giants Team Information",
          description: "Basic team information and current stats",
          mimeType: "application/json",
        },
        {
          uri: "team://giants/schedule",
          name: "SF Giants Schedule",
          description: "Current team schedule and upcoming games",
          mimeType: "application/json",
        },
        {
          uri: "team://giants/roster",
          name: "SF Giants Roster",
          description: "Current team roster and player information",
          mimeType: "application/json",
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        let content: any;

        switch (uri) {
          case "team://giants/info":
            content = await this.mlbClient.getTeamInfo(CONFIG.giantsTeamId);
            break;
          case "team://giants/schedule":
            content = await this.mlbClient.getTeamSchedule(CONFIG.giantsTeamId);
            break;
          case "team://giants/roster":
            content = await this.mlbClient.getTeamRoster(CONFIG.giantsTeamId);
            break;
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(content, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                error: errorMessage,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case "get-team-schedule":
            result = await this.handleGetTeamSchedule(args as any);
            break;
          case "get-game-preview":
            result = await this.handleGetGamePreview(args as any);
            break;
          case "get-team-roster":
            result = await this.handleGetTeamRoster(args as any);
            break;
          case "get-player-stats":
            result = await this.handleGetPlayerStats(args as any);
            break;
          case "analyze-matchup":
            result = await this.handleAnalyzeMatchup(args as any);
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: errorMessage,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleGetTeamSchedule(args: any) {
    const { teamId = CONFIG.giantsTeamId, startDate, endDate, limit = 10 } = args;
    const schedule = await this.mlbClient.getTeamSchedule(teamId, startDate, endDate);
    
    if (schedule && schedule.dates) {
      const games = schedule.dates.flatMap(date => date.games).slice(0, limit);
      return {
        success: true,
        data: {
          ...schedule,
          dates: schedule.dates.map(date => ({
            ...date,
            games: date.games.slice(0, limit),
          })).filter(date => date.games.length > 0),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      error: "No schedule data found",
      timestamp: new Date().toISOString(),
    };
  }

  private async handleGetGamePreview(args: any) {
    const { gameId, includeMatchups = true, includePredictions = false } = args;
    const gameData = await this.mlbClient.getGameFeed(gameId);
    
    if (!gameData) {
      return {
        success: false,
        error: "Game not found",
        timestamp: new Date().toISOString(),
      };
    }

    let preview: any = {
      success: true,
      data: gameData,
      timestamp: new Date().toISOString(),
    };

    if (includeMatchups) {
      preview.data.matchups = await this.analytics.analyzeGameMatchups(gameData);
    }

    if (includePredictions) {
      preview.data.predictions = await this.analytics.generateGamePredictions(gameData);
    }

    return preview;
  }

  private async handleGetTeamRoster(args: any) {
    const { teamId = CONFIG.giantsTeamId, rosterType = "active", season } = args;
    const roster = await this.mlbClient.getTeamRoster(teamId, rosterType, season);
    
    return {
      success: true,
      data: roster,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleGetPlayerStats(args: any) {
    const { playerId, stats = "season", season } = args;
    const playerStats = await this.mlbClient.getPlayerStats(playerId, stats, season);
    
    return {
      success: true,
      data: playerStats,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleAnalyzeMatchup(args: any) {
    const { batterId, pitcherId, season } = args;
    const matchup = await this.analytics.analyzeMatchup(batterId, pitcherId, season);
    
    return {
      success: true,
      data: matchup,
      timestamp: new Date().toISOString(),
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SF Giants MCP Server running on stdio");
  }
}

// Start the server
async function main(): Promise<void> {
  const server = new GiantsMCPServer();
  await server.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
