import { supabase } from '../supabase';

class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

// UPDATE trade status to complete or cancelled
export async function updateTradeStatus(userID: string, tradeId: number, trade_status: string) {
  const validStatuses = ['COMPLETE', 'CANCELLED']
  
  if (!validStatuses.includes(trade_status)) {
    throw new AppError('Invalid trade status value', 400);
  }

  //find the trade a verify that the user is part of the trade 
  const { data: trade, error: fetchError} = await supabase
    .from('Trade')
    .select(`trade_id, trade_status, 
      Match!Trade_match_id_fkey(user_id_a, user_id_b)`
    )
    .eq('trade_id', tradeId)
    .single();
  
  if (fetchError || !trade) throw new AppError('Trade no found', 404);

  if(trade.trade_status !== 'PENDING') {
    throw new AppError(`Cannot update a trade with status ${trade.trade_status}`, 400);
  }

  const updatePayload: Record<string, any>= { trade_status };
  if (trade_status === 'COMPLETE'){
    updatePayload.trade_date_completed = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('Trade')
    .update(updatePayload)
    .eq('trade_id', tradeId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  return data;

}

export async function getPastTrades(userId: string){

  //get all the matches the user is part of 
  const {data: matches , error: matchError} = await supabase
    .from('Match')
    .select('match_id')
    .or(`user_id_a.eq.${userId}, user_id_b.eq.${userId}`)

  const matchIds = matches?.map(m => m.match_id) ?? [];
  if (matchIds.length === 0) return [];

  //get all the COMPLETED and CANCELLED trades of the user 
  const {data, error} = await supabase
    .from('Trade')
    .select(` trade_id, trade_status, trade_date_completed, match_id,
      post_a:Post!Trade_post_id_a_fkey(
        post_id, post_title, post_image_url,
        User!Post_user_id_fkey(user_name)
      ),
      post_b:Post!Trade_post_id_b_fkey(
        post_id, post_title, post_image_url,
        User!Post_user_id_fkey(user_name)
      )
    `)
    .or(`trade_status.eq.COMPLETE, trade_status.eq.CANCELLED`)
    .in('match_id', matchIds);
    
    if (error) throw new AppError(error.message, 500);
   
    return data ?? [];


}