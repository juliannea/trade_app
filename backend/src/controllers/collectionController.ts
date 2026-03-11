import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as collectionService from '../services/collectionService';

export async function getAllCollections(req: AuthRequest, res: Response) {
  try {
    const collections = await collectionService.getAllCollections();
    res.json(collections);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }

}