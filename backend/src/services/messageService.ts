import { supabase } from '../supabase';

class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

//GET all messages between 2 users within a match 
export async function getMessages(userId: string, matchId: number){

  //check that match id is valid 
  const { data: match, error: matchError } = await supabase
    .from('Match')
    .select('user_id_a, user_id_b')
    .eq('match_id', matchId)
    .single();

  if (matchError || !match) throw new AppError('Match not found', 404);
  if (match.user_id_a !== userId && match.user_id_b !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  //select and return all messages of the users within the match 
  const { data, error } = await supabase
    .from('Message')
    .select(`match_id, message_sent_by_user_a, message_content, message_created_at`)
    .eq('match_id', matchId)
    .order('message_created_at', {ascending: true});

  if (error) throw new AppError(error.message, 500);
  if (!data)  throw new AppError('No messages yet', 404);

  return data;

}