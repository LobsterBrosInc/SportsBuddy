import { Router } from 'express';
import { gameController } from '../controllers/gameController';
import { healthController } from '../controllers/healthController';

const router = Router();

// Health check endpoint
router.get('/health', healthController.healthCheck.bind(healthController));

// Main API endpoint - Giants next game preview
router.get('/giants/next-game', gameController.getNextGame.bind(gameController));

// Frontend compatibility endpoints
router.get('/games/upcoming', gameController.getUpcomingGames.bind(gameController));
router.get('/games/:id/preview', gameController.getGamePreview.bind(gameController));
router.get('/teams/:id', gameController.getTeamInfo.bind(gameController));

export { router as apiRouter };
