import { Request, Response } from 'express';
import { mcpClient } from '../services/mcpClient';
import { ResponseFormatter } from '../utils/responseFormatter';
import Logger from '../utils/logger';

export class HealthController {
  private startTime: number = Date.now();

  async healthCheck(req: Request, res: Response): Promise<void> {
    const { correlationId } = req.context;
    
    try {
      Logger.debug('Processing health check request', { correlationId });

      // Check MCP server health
      const mcpStatus = await mcpClient.healthCheck(correlationId);

      const services = {
        mcpServer: mcpStatus,
        database: 'not applicable' as const
      };

      const uptime = Math.floor((Date.now() - this.startTime) / 1000);

      ResponseFormatter.health(res, services, uptime);

    } catch (error) {
      Logger.error('Health check failed', {
        correlationId,
        error: error instanceof Error ? error : 'Unknown error'
      });

      // Return unhealthy status
      const services = {
        mcpServer: 'error' as const,
        database: 'not applicable' as const
      };

      const uptime = Math.floor((Date.now() - this.startTime) / 1000);

      ResponseFormatter.health(res, services, uptime);
    }
  }
}

export const healthController = new HealthController();
