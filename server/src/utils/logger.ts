import winston from 'winston';
import { LogContext } from '../types';

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' })
        ]
      : [])
  ]
});

export class Logger {
  static info(message: string, context?: LogContext) {
    logger.info(message, context);
  }

  static error(message: string, context?: LogContext) {
    logger.error(message, context);
  }

  static warn(message: string, context?: LogContext) {
    logger.warn(message, context);
  }

  static debug(message: string, context?: LogContext) {
    logger.debug(message, context);
  }

  static request(context: LogContext) {
    this.info(`${context.method} ${context.url}`, {
      correlationId: context.correlationId || 'unknown',
      userAgent: context.userAgent,
      ip: context.ip
    });
  }

  static response(context: LogContext) {
    const level = context.statusCode && context.statusCode >= 400 ? 'error' : 'info';
    const message = `${context.method} ${context.url} - ${context.statusCode} (${context.duration}ms)`;
    
    logger.log(level, message, {
      correlationId: context.correlationId,
      statusCode: context.statusCode,
      duration: context.duration
    });
  }

  static mcpCall(action: string, context: LogContext) {
    this.debug(`MCP Server call: ${action}`, context);
  }

  static mcpResponse(action: string, success: boolean, duration: number, context: LogContext) {
    const message = `MCP Server response: ${action} - ${success ? 'success' : 'failure'} (${duration}ms)`;
    this.info(message, { ...context, duration, success });
  }
}

export default Logger;
