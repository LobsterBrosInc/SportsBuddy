import { McpCommunicationError, TimeoutError } from '../types';
import Logger from '../utils/logger';

interface McpClientConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTime: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class McpClient {
  private config: McpClientConfig;
  private circuitBreaker: CircuitBreakerState;

  constructor(config?: Partial<McpClientConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 8000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTime: 60000,
      ...config
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed'
    };
  }

  async getGiantsGamePreview(correlationId: string): Promise<any> {
    const startTime = Date.now();
    
    Logger.mcpCall('getGiantsGamePreview', { correlationId });

    try {
      // Check circuit breaker
      if (this.isCircuitOpen()) {
        throw new McpCommunicationError('MCP server circuit breaker is open', correlationId);
      }

      const result = await this.executeWithRetry(
        () => this.callMcpServer('getGiantsGamePreview', {}),
        correlationId
      );

      const duration = Date.now() - startTime;
      Logger.mcpResponse('getGiantsGamePreview', true, duration, { correlationId });

      // Reset circuit breaker on success
      this.resetCircuitBreaker();

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.mcpResponse('getGiantsGamePreview', false, duration, { 
        correlationId,
        error: error instanceof Error ? error : 'Unknown error'
      });

      // Record failure for circuit breaker
      this.recordFailure();

      if (error instanceof Error) {
        throw new McpCommunicationError(error.message, correlationId);
      }
      throw error;
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    correlationId: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.withTimeout(operation(), this.config.timeout);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        Logger.warn(`MCP call attempt ${attempt} failed`, {
          correlationId,
          attempt,
          error: lastError,
          willRetry: attempt < this.config.maxRetries
        });

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  private async callMcpServer(_method: string, _params: any): Promise<any> {
    // For now, we'll simulate the MCP server call
    // In a real implementation, this would connect to the actual MCP server
    // via stdio, TCP, or HTTP depending on the transport method
    
    try {
      // Simulate network delay
      await this.delay(100 + Math.random() * 200);
      
      // Simulate occasional failures for testing
      if (Math.random() < 0.05) { // 5% failure rate
        throw new Error('Simulated MCP server connection failure');
      }

      // Return mock data that matches our expected format
      return {
        success: true,
        data: {
          game: {
            id: `game-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            homeTeam: { name: 'Giants', record: '45-42' },
            awayTeam: { name: 'Dodgers', record: '52-35' },
            venue: 'Oracle Park',
            status: 'scheduled'
          },
          pitchingMatchup: {
            giants: { 
              name: 'Logan Webb', 
              era: 3.25, 
              recentForm: 'Strong',
              wins: 10,
              losses: 8,
              strikeouts: 145
            },
            opponent: { 
              name: 'Walker Buehler', 
              era: 2.95, 
              recentForm: 'Excellent',
              wins: 12,
              losses: 4,
              strikeouts: 165
            },
            advantage: 'Slight edge to Dodgers'
          },
          keyInsights: [
            'Giants historically perform well against Buehler at Oracle Park',
            'Webb\'s splitter has been dominant in last 3 starts',
            'Dodgers offense struggling vs righties this month'
          ],
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`MCP server communication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError());
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'open') {
      // Check if we should try again (reset time elapsed)
      if (Date.now() - this.circuitBreaker.lastFailureTime > this.config.circuitBreakerResetTime) {
        this.circuitBreaker.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.state = 'open';
      Logger.warn('MCP circuit breaker opened', {
        correlationId: 'circuit-breaker',
        failures: this.circuitBreaker.failures,
        threshold: this.config.circuitBreakerThreshold
      });
    }
  }

  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.failures > 0) {
      Logger.info('MCP circuit breaker reset', {
        correlationId: 'circuit-breaker',
        previousFailures: this.circuitBreaker.failures
      });
    }
    
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
  }

  // Health check method
  async healthCheck(correlationId: string): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      await this.withTimeout(this.callMcpServer('ping', {}), 2000);
      return 'connected';
    } catch (error) {
      Logger.error('MCP health check failed', { correlationId, error });
      return this.circuitBreaker.state === 'open' ? 'error' : 'disconnected';
    }
  }
}

// Export singleton instance
export const mcpClient = new McpClient();
