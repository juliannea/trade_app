import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as TradeController from '../controllers/tradeController';

const router = Router();

router.patch('/:tradeId', requireAuth, TradeController.updateTradeStatus);

router.get('/history', requireAuth, TradeController.getPastTrades);

router.get('/pending', requireAuth, TradeController.getPendingTrades);

router.post('/', requireAuth, TradeController.createTrade);

export default router;