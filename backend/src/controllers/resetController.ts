import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../supabase';

export async function resetSwipesAndMatches(req: AuthRequest, res: Response) {
  try {
    await supabase.from('Match').delete().neq('match_id', 0);
    await supabase.from('Swipe').delete().neq('post_id', 0);
    res.json({ message: 'Swipe and Match tables cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}