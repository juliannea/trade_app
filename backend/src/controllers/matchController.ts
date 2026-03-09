import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as MatchService from '../services/matchService';

export async function getUserMatches(req: AuthRequest, res: Response) {
  try {
    const matches = await MatchService.getUserMatches(req.userId!);
    res.json(matches);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}