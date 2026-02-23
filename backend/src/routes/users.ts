import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

//GET returns the email of logged in user 
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  
  const { data, error } = await supabase
    .from('User')
    .select('user_email')
    .eq('user_id', req.userId)  //only select the logged in user
    .single();                 

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'User not found' });

  res.json({ email: data.user_email });
});

export default router;