import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as SwipeController from '../controllers/swipeController';

const router = Router();

//POST creates a new swipe, requires authentication
router.post('/', requireAuth, SwipeController.swipe);

//GET returns all swipes made by the logged in user, requires authentication
router.get('/me', requireAuth, SwipeController.getUserSwipes);

export default router;