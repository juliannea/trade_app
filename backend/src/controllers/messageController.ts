import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as MessageService from '../services/messageService';

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const matchId = Number(req.params.matchId);
    if (isNaN(matchId)) return res.status(400).json({ error: 'Invalid match_id' });
    const messages = await MessageService.getMessages(req.userId!, matchId);
    res.json(messages)
  }
    catch(err: any){
      res.status(err.status ?? 500).json({ error: err.message });
    }
}

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const matchId = Number(req.params.matchId);
    const { messageContent } = req.body;
    if (isNaN(matchId)) return res.status(400).json({ error: 'Invalid match_id' });
    if (!messageContent) return res.status(400).json({ error: 'messageContent is required' });
    
    const message = await MessageService.sendMessage(req.userId!, matchId, messageContent);
    res.json(message);
  }
  catch(err: any){
    res.status(err.status ?? 500).json({ error: err.message });
  }
}