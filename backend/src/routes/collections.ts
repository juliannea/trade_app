import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as CollectionController from '../controllers/collectionController';

const router = Router();

//GET returns all collections, requires auth
router.get('/', requireAuth, CollectionController.getAllCollections);

export default router;