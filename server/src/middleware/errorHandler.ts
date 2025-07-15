import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { ResponseFormatter } from '../utils/responseFormatter';
import Logger from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = req.context?.correlationId || 'unknown';

  // Log the error with full context
  Logger.error('Unhandled error occurred', {
    correlationId,
    method: req.method,
    url: req.url,
    error: error,
    stack: error.stack,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Handle different error types
  if (error instanceof ApiError) {
    ResponseFormatter.error(res, error, correlationId);
  } else if (error.name === 'ValidationError') {
    const validationError = new ApiError(error.message, 400, 'VALIDATION_ERROR');
    ResponseFormatter.error(res, validationError, correlationId);
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    const syntaxError = new ApiError('Invalid JSON in request body', 400, 'INVALID_JSON');
    ResponseFormatter.error(res, syntaxError, correlationId);
  } else {
    // Unknown error - log and return generic response
    const genericError = new ApiError('An unexpected error occurred', 500, 'INTERNAL_ERROR');
    ResponseFormatter.error(res, genericError, correlationId);
  }
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const correlationId = req.context?.correlationId || 'unknown';
  Logger.warn('Route not found', {
    correlationId,
    method: req.method,
    url: req.url
  });
  
  ResponseFormatter.notFound(res, correlationId);
};

export const timeoutHandler = (timeoutMs: number = 10000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const correlationId = req.context?.correlationId || 'unknown';
        Logger.error('Request timeout', {
          correlationId,
          method: req.method,
          url: req.url,
          timeout: timeoutMs
        });
        
        ResponseFormatter.timeout(res, correlationId);
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};
