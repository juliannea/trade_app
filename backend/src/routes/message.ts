import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import * as MessageController from '../controllers/messageController';

const router = Router();

router.get('/:matchId', requireAuth, MessageController.getMessages)

export default router