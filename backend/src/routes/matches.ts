import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as MatchController from '../controllers/matchController';

const router = Router();

//GET returns all matches for the logged in user, requires authentication
router.get('/', requireAuth, MatchController.getUserMatches);

export default router;