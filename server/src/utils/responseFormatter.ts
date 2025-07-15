import { Response } from 'express';
import { ApiResponse, ApiError } from '../types';

export class ResponseFormatter {
  static success<T>(res: Response, data: T, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
  }

  static error(res: Response, error: ApiError | Error, correlationId: string): Response {
    const isApiError = error instanceof ApiError;
    const statusCode = isApiError ? error.statusCode : 500;
    const errorCode = isApiError ? error.code : 'INTERNAL_ERROR';
    
    const response: ApiResponse = {
      success: false,
      error: {
        message: this.sanitizeErrorMessage(error.message, statusCode),
        code: errorCode,
        correlationId
      },
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  static health(res: Response, services: any, uptime: number): Response {
    const allServicesHealthy = Object.values(services).every(
      status => status === 'connected' || status === 'not applicable'
    );

    const response = {
      status: allServicesHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
      uptime
    };

    const statusCode = allServicesHealthy ? 200 : 503;
    return res.status(statusCode).json(response);
  }

  private static sanitizeErrorMessage(message: string, statusCode: number): string {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
      return 'An internal server error occurred';
    }
    return message;
  }

  static notFound(res: Response, correlationId: string): Response {
    return this.error(res, new ApiError('Endpoint not found', 404, 'NOT_FOUND'), correlationId);
  }

  static timeout(res: Response, correlationId: string): Response {
    return this.error(res, new ApiError('Request timeout', 408, 'TIMEOUT'), correlationId);
  }

  static serviceUnavailable(res: Response, correlationId: string, service: string = 'service'): Response {
    return this.error(
      res, 
      new ApiError(`${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE'), 
      correlationId
    );
  }

  static rateLimit(res: Response, correlationId: string): Response {
    return this.error(
      res,
      new ApiError('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED'),
      correlationId
    );
  }
}
