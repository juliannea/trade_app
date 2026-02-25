import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

//GET returns User's own profile information, requires authentication
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  
  const { data, error } = await supabase
    .from('User')
    .select('user_id, user_name, user_first_name, user_last_name, user_email, user_phone')
    .eq('user_id', req.userId)  //only select the logged in user
    .single();                 

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'User not found' });

  res.json(data);
});

//GET returns another user's profile information, requires authentication
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('User')
    .select('user_id, user_name, user_first_name, user_last_name')
    .eq('user_id', req.params.id)  //select the user with the specified id
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'User not found' });

  res.json(data);
});

//PATCH updates the logged in user's profile information, requires authentication
router.patch('/', requireAuth, async (req: AuthRequest, res) => {
  const{ user_name, user_first_name, user_last_name, user_phone } = req.body;
  
  //user can update any combination of these fields, so we only include the ones that are provided in the update object
  const updates: any = {};
  if (user_name) updates.user_name = user_name;
  if (user_first_name) updates.user_first_name = user_first_name;
  if (user_last_name) updates.user_last_name = user_last_name;
  if (user_phone) updates.user_phone = user_phone;

  const { data, error } = await supabase
    .from('User')
    .update(updates)
    .eq('user_id', req.userId) //only update info of the logged in user
    .select('user_id, user_name, user_first_name, user_last_name, user_phone')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

//========== may need to update in the future since deleting a user will also delete posts, trades, and messages ==========
//DELETE deletes the logged in user's account, requires authentication
router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  //delete the user from the User table, which will also cascade delete all related data in other tables
  const { error } = await supabase
    .from('User')
    .delete()
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Account deleted successfully' });
});



export default router;