import { api } from '../lib/api';

//type defs matching backend response
export interface TradePost {
  post_id: number;
  title: string;
  image: string | null;
  user_id: string;
  username: string;
}

export interface TradeResponse {
  trade_id: number;
  trade_status: 'PENDING' | 'COMPLETE' | 'CANCELLED';
  match_id: number;
  trade_date_completed: string | null;
  post_a: TradePost;
  post_b: TradePost;
  user_a_id: string;
  user_b_id: string;
}

export interface CreateTradeRequest {
  matchId: number;
  postIdA: number;
  postIdB: number;
}

export interface UpdateTradeStatusRequest {
  trade_status: 'COMPLETE' | 'CANCELLED';
}

//service funcs
export const tradeService = {
  //get all pending trades for the current user
  getPendingTrades: () =>
    api.get<TradeResponse[]>('/api/trades/pending'),

  //ge4t trade history (completed or cancelled)
  getTradeHistory: () =>
    api.get<TradeResponse[]>('/api/trades/history'),

  //create a new trade
  createTrade: (data: CreateTradeRequest) =>
    api.post<TradeResponse>('/api/trades', data),

  //update trade status (confirm or cancel)
  updateTradeStatus: (tradeId: number, data: UpdateTradeStatusRequest) =>
    api.patch<TradeResponse>(`/api/trades/${tradeId}`, data),
};
