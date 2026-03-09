import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import * as PostController from '../controllers/postController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

//POST create a new post with image upload
router.post('/', requireAuth, upload.single('image'), PostController.insertPost);

//GET returns all created posts of the logged in user
router.get('/', requireAuth, PostController.getOwnPosts);

//GET returns all created posts of a specific collection, requires authentication 
router.get('/collection/:collectionId', requireAuth, PostController.getPostsByCollection);

//DELETE a post by the post_id, requires authentication  
router.delete('/:postId', requireAuth, PostController.deletePost);

export default router;