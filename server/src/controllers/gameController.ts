import { Request, Response, NextFunction } from 'express';
import { mcpClient } from '../services/mcpClient';
import { ResponseFormatter } from '../utils/responseFormatter';
import { GamePreviewData, GameNotFoundError, ApiError } from '../types';
import Logger from '../utils/logger';

export class GameController {
  async getNextGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { correlationId } = req.context;
    
    try {
      Logger.info('Processing next game request', { correlationId });

      // Input validation (if date parameter is provided)
      const dateParam = req.query.date as string;
      if (dateParam && !this.isValidDateFormat(dateParam)) {
        throw new ApiError('Invalid date format. Expected YYYY-MM-DD', 400, 'INVALID_DATE_FORMAT');
      }

      // Call MCP server to get game preview
      const mcpResponse = await mcpClient.getGiantsGamePreview(correlationId);

      if (!mcpResponse || !mcpResponse.success) {
        throw new GameNotFoundError(correlationId);
      }

      // Transform MCP response to API format
      const gamePreview = this.transformMcpResponse(mcpResponse.data);

      // Set caching headers for client optimization
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'ETag': this.generateETag(gamePreview),
        'Last-Modified': new Date(gamePreview.lastUpdated).toUTCString()
      });

      // Check if client has cached version
      if (req.get('If-None-Match') === this.generateETag(gamePreview)) {
        res.status(304).end();
        return;
      }

      Logger.info('Successfully retrieved game preview', {
        correlationId,
        gameId: gamePreview.game.id,
        venue: gamePreview.game.venue
      });

      ResponseFormatter.success(res, gamePreview);

    } catch (error) {
      Logger.error('Error in getNextGame controller', {
        correlationId,
        error: error instanceof Error ? error : 'Unknown error'
      });
      
      next(error);
    }
  }

  private transformMcpResponse(mcpData: any): GamePreviewData {
    if (!mcpData || !mcpData.game) {
      throw new ApiError('Invalid MCP response format', 500, 'INVALID_MCP_RESPONSE');
    }

    return {
      game: {
        id: mcpData.game.id,
        date: mcpData.game.date,
        homeTeam: {
          name: mcpData.game.homeTeam.name,
          record: mcpData.game.homeTeam.record,
          city: mcpData.game.homeTeam.city,
          abbreviation: mcpData.game.homeTeam.abbreviation
        },
        awayTeam: {
          name: mcpData.game.awayTeam.name,
          record: mcpData.game.awayTeam.record,
          city: mcpData.game.awayTeam.city,
          abbreviation: mcpData.game.awayTeam.abbreviation
        },
        venue: mcpData.game.venue,
        status: mcpData.game.status
      },
      pitchingMatchup: {
        giants: {
          name: mcpData.pitchingMatchup.giants.name,
          era: Number(mcpData.pitchingMatchup.giants.era),
          recentForm: mcpData.pitchingMatchup.giants.recentForm,
          wins: mcpData.pitchingMatchup.giants.wins,
          losses: mcpData.pitchingMatchup.giants.losses,
          strikeouts: mcpData.pitchingMatchup.giants.strikeouts
        },
        opponent: {
          name: mcpData.pitchingMatchup.opponent.name,
          era: Number(mcpData.pitchingMatchup.opponent.era),
          recentForm: mcpData.pitchingMatchup.opponent.recentForm,
          wins: mcpData.pitchingMatchup.opponent.wins,
          losses: mcpData.pitchingMatchup.opponent.losses,
          strikeouts: mcpData.pitchingMatchup.opponent.strikeouts
        },
        advantage: mcpData.pitchingMatchup.advantage
      },
      keyInsights: Array.isArray(mcpData.keyInsights) ? mcpData.keyInsights : [],
      lastUpdated: mcpData.lastUpdated || new Date().toISOString()
    };
  }

  private isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  private generateETag(data: GamePreviewData): string {
    // Simple ETag generation based on lastUpdated and game ID
    const content = `${data.game.id}-${data.lastUpdated}`;
    return `"${Buffer.from(content).toString('base64')}"`;
  }

  // Frontend compatibility endpoints
  async getUpcomingGames(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { correlationId } = req.context;
    
    try {
      Logger.info('Processing upcoming games request', { correlationId });

      // Create a future date (tomorrow at 7:15 PM)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 15, 0, 0);

      // For now, return mock Giants games data that matches frontend expectations
      const mockGames = [
        {
          gamePk: 777108,
          gameDate: tomorrow.toISOString(),
          teams: {
            away: {
              team: { name: 'Los Angeles Dodgers' },
              leagueRecord: { wins: 52, losses: 35, pct: '.598' }
            },
            home: {
              team: { name: 'San Francisco Giants' },
              leagueRecord: { wins: 45, losses: 42, pct: '.517' }
            }
          },
          venue: { name: 'Oracle Park' },
          status: { 
            abstractGameState: 'Preview',
            detailedState: 'Scheduled'
          }
        }
      ];

      ResponseFormatter.success(res, mockGames);

    } catch (error) {
      Logger.error('Error in getUpcomingGames controller', {
        correlationId,
        error: error instanceof Error ? error : 'Unknown error'
      });
      
      next(error);
    }
  }

  async getGamePreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { correlationId } = req.context;
    const gameId = req.params.id;
    
    try {
      Logger.info('Processing game preview request', { correlationId, gameId });

      // Create a future date (tomorrow at 7:15 PM)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 15, 0, 0);

      // Mock game preview data that matches GamePreview interface
      const mockPreview = {
        game: {
          gamePk: parseInt(gameId),
          gameDate: tomorrow.toISOString(),
          teams: {
            away: {
              team: { name: 'Los Angeles Dodgers' },
              leagueRecord: { wins: 52, losses: 35, pct: '.598' }
            },
            home: {
              team: { name: 'San Francisco Giants' },
              leagueRecord: { wins: 45, losses: 42, pct: '.517' }
            }
          },
          venue: { name: 'Oracle Park' },
          status: { 
            abstractGameState: 'Preview',
            detailedState: 'Scheduled'
          }
        },
        teams: {
          away: { 
            name: 'Los Angeles Dodgers',
            leagueRecord: { wins: 52, losses: 35, pct: '.598' }
          },
          home: { 
            name: 'San Francisco Giants',
            leagueRecord: { wins: 45, losses: 42, pct: '.517' }
          }
        },
        venue: { name: 'Oracle Park' },
        weather: {
          condition: 'Clear',
          temp: '72°F',
          wind: '5 mph SW'
        },
        probablePitchers: {
          away: {
            fullName: 'Walker Buehler',
            pitchingStats: {
              era: '2.95',
              whip: '1.12',
              wins: 12,
              losses: 4
            }
          },
          home: {
            fullName: 'Logan Webb',
            pitchingStats: {
              era: '3.25',
              whip: '1.15',
              wins: 10,
              losses: 8
            }
          }
        },
        gameNotes: [
          'Giants historically perform well against Buehler at Oracle Park',
          'Webb\'s splitter has been dominant in last 3 starts',
          'Dodgers offense struggling vs righties this month'
        ],
        predictions: {
          winProbability: { home: 0.52, away: 0.48 },
          expectedScore: { home: 5, away: 4 }
        }
      };

      ResponseFormatter.success(res, mockPreview);

    } catch (error) {
      Logger.error('Error in getGamePreview controller', {
        correlationId,
        error: error instanceof Error ? error : 'Unknown error'
      });
      
      next(error);
    }
  }

  async getTeamInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { correlationId } = req.context;
    const teamId = req.params.id;
    
    try {
      Logger.info('Processing team info request', { correlationId, teamId });

      // Mock Giants team data
      const mockTeam = {
        id: 137,
        name: 'San Francisco Giants',
        teamName: 'Giants',
        locationName: 'San Francisco',
        league: { name: 'National League' },
        division: { name: 'NL West' },
        teamStats: {
          wins: 45,
          losses: 42,
          winningPercentage: '.517'
        }
      };

      ResponseFormatter.success(res, mockTeam);

    } catch (error) {
      Logger.error('Error in getTeamInfo controller', {
        correlationId,
        error: error instanceof Error ? error : 'Unknown error'
      });
      
      next(error);
    }
  }
}

export const gameController = new GameController();
