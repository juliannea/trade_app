import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as TradeService from '../services/tradeService';

export async function updateTradeStatus(req: AuthRequest, res: Response) {
  try {
    const tradeId = Number(req.params.tradeId);
    if (isNaN(tradeId)) return res.status(400).json({ error: 'Invalid trade_id' });

    const { trade_status } = req.body;
    if (!trade_status) return res.status(400).json({ error: 'trade_status is required' });

    const trade = await TradeService.updateTradeStatus(req.userId!, tradeId, trade_status);
    res.json(trade);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function getPastTrades(req: AuthRequest, res: Response) {
  try{
    const pastTrades = await TradeService.getPastTrades(req.userId!);
    res.json(pastTrades)
  } catch (err: any) {
    res.status(err.status ?? 500).json({err: err.message});
  }
}

export async function getPendingTrades(req: AuthRequest, res: Response) {
  try{
    const pendingTrades = await TradeService.getPendingTrades(req.userId!);
    res.json(pendingTrades)
  } catch (err: any) {
    res.status(err.status ?? 500).json({err: err.message});
  }
}

export async function createTrade(req: AuthRequest, res: Response) {
  try {
    const { matchId, postIdA, postIdB } = req.body;
    if (!matchId || !postIdA || !postIdB) return res.status(400).json({ error: 'matchId, postIdA and postIdB are required' });

    const trade = await TradeService.createTrade(req.userId!, matchId, postIdA, postIdB);
    res.json(trade);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}