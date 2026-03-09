import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as SwipeService from '../services/swipeService';

export async function swipe(req: AuthRequest, res: Response) {
  try {
    const {post_id, direction} = req.body;
    if (!post_id || !direction) return res.status(400).json({ error: 'post_id and direction are required' });
    if (direction !== 'LEFT' && direction !== 'RIGHT') return res.status(400).json({ error: 'direction must be either LEFT or RIGHT' });

    await SwipeService.swipe(req.userId!, post_id, direction);
    res.json({ message: 'Swipe recorded successfully' });
  } catch (err: any) {
    res.status(err.status ?? 500).json({error: err.message});
  }
}

export async function getUserSwipes(req: AuthRequest, res: Response) {
  try {
    const swipes = await SwipeService.getUserSwipes(req.userId!);
    res.json(swipes);
  } catch (err: any) {
    res.status(err.status ?? 500).json({error: err.message});
  }
}