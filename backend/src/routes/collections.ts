import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as UserController from '../controllers/collectionController';

const router = Router();

//GET returns all collections, requires auth
router.get('/', requireAuth, UserController.getAllCollections);

export default router;