import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as PostService from '../services/postService';

export async function insertPost(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Image is required' });

    const { post_title, post_caption, collection_id } = req.body;
    if (!collection_id) return res.status(400).json({ error: 'collection_id is required' });

    const post = await PostService.insertPost(
      req.userId!,
      file,
      post_title,
      post_caption,
      Number(collection_id)
    );

    res.status(201).json(post);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

//GET returns all created posts of the logged in user, requires authentication
export async function getOwnPosts(req: AuthRequest, res: Response) {
  try {
    const posts = await PostService.getOwnPosts(req.userId!);
    res.json(posts);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

//GET returns all created posts of a specific collection, requires authentication 
export async function getPostsByCollection(req: AuthRequest, res: Response) {
  try {
    const collectionId = Number(req.params.collectionId);
    if (isNaN(collectionId)) return res.status(400).json({ error: 'Invalid collection_id' });

    const posts = await PostService.getPostsByCollection(collectionId);
    res.json(posts);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

//DELETE a post by the post_id, requires authentication  
export async function deletePost(req: AuthRequest, res: Response) {
  try{
    await PostService.deletePost(Number(req.params.postId));
    res.json({ message: 'Post deleted successfully' });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}