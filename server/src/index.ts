import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './routes/api';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/errorHandler';
import Logger from './utils/logger';

// Environment configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Create Express application
const app = express();

// Trust proxy if running behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API server
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      correlationId: 'rate-limit'
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    Logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        correlationId: 'rate-limit'
      },
      timestamp: new Date().toISOString()
    });
  }
});

app.use(limiter);

// Request parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request timeout middleware (10 seconds)
app.use(timeoutHandler(10000));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint (before API routes for quick access)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mcpServer: 'unknown', // Will be checked in actual health endpoint
      database: 'not applicable'
    },
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', apiRouter);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Server startup
const server = app.listen(PORT, () => {
  Logger.info(`Server started`, {
    port: PORT,
    environment: NODE_ENV,
    corsOrigin: CORS_ORIGIN,
    pid: process.pid
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  Logger.info(`Received ${signal}, starting graceful shutdown`);
  
  server.close((err) => {
    if (err) {
      Logger.error('Error during server shutdown', { error: err });
      process.exit(1);
    }
    
    Logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    Logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', { error: error.stack });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection', { 
    reason: reason instanceof Error ? reason.stack : reason,
    promise 
  });
  gracefulShutdown('unhandledRejection');
});

export default app;
