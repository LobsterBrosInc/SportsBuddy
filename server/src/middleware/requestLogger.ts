import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../utils/logger';
import { RequestContext } from '../types';

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = uuidv4();
  const startTime = Date.now();

  // Add context to request
  const userAgent = req.get('User-Agent');
  req.context = {
    correlationId,
    startTime,
    method: req.method,
    url: req.url,
    userAgent: userAgent,
    ip: req.ip || req.connection.remoteAddress || 'unknown'
  };

  // Log incoming request
  Logger.request(req.context);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    Logger.response({
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
