import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as UserController from '../controllers/userController';

const router = Router();

//GET returns User's own profile information, requires authentication
router.get('/', requireAuth, UserController.getOwnProfile);

//GET returns another user's profile information, requires authentication
router.get('/:id', requireAuth, UserController.getUserById);

//PATCH updates the logged in user's profile information, requires authentication
router.patch('/', requireAuth, UserController.updateProfile);

//========== may need to update in the future since deleting a user will also delete posts, trades, and messages ==========
//DELETE deletes the logged in user's account, requires authentication
router.delete('/', requireAuth, UserController.deleteAccount );


export default router;