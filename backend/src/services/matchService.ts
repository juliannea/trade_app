import {supabase} from '../supabase';

class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

export async function getUserMatches(userId: string) {
   const {data, error} = await supabase
      .from('Match')
      .select(`match_id, matched_at, match_status, user_id_a, user_id_b,
          user_a:User!Match_user_id_a_fkey(
            user_name
         ),
         user_b:User!Match_user_id_b_fkey(
            user_name
         )`)
      .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`) // get all matches where the current user is either user_id_a or user_id_b
      .eq('match_status', 'ACTIVE'); // only return active matches
      
   if (error) throw new AppError(error.message, 500);
   return data;
}