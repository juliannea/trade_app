import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as UserController from '../controllers/userController';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });


//GET returns User's own profile information, requires authentication
router.get('/', requireAuth, UserController.getOwnProfile);

//GET returns another user's profile information, requires authentication
router.get('/:id', requireAuth, UserController.getUserById);

//PATCH updates the logged in user's profile information, requires authentication
router.patch('/', requireAuth, UserController.updateProfile);

//========== may need to update in the future since deleting a user will also delete posts, trades, and messages ==========
//DELETE deletes the logged in user's account, requires authentication
router.delete('/', requireAuth, UserController.deleteAccount );

//UPDATE profile picture 
router.patch('/profile-picture', requireAuth, upload.single('image'), UserController.updateProfilePic);

router.delete('/profile-picture', requireAuth, UserController.deleteProfilePic);


export default router;