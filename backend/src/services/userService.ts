import { supabase } from '../supabase';

// custom error with an HTTP status attached
class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

//GET returns User's own profile information, requires authentication
export async function getOwnProfile(userId: string) {
  const { data, error } = await supabase
    .from('User')
    .select('user_id, user_name, user_first_name, user_last_name, user_email, user_phone')
    .eq('user_id', userId)
    .single();

  if (error) throw new AppError(error.message, 500);
  if (!data)  throw new AppError('User not found', 404);
  return data;
}

//GET returns another user's profile information, requires authentication
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('User')
    .select('user_id, user_name, user_first_name, user_last_name')
    .eq('user_id', userId)
    .single();

  if (error) throw new AppError(error.message, 500);
  if (!data)  throw new AppError('User not found', 404);
  return data;
}

//PATCH updates the logged in user's profile information, requires authentication
export async function updateProfile(userId: string,{
    user_name,
    user_first_name,
    user_last_name,
    user_phone,
  }: {
    user_name?: string;
    user_first_name?: string;
    user_last_name?: string;
    user_phone?: string;
  }) {

  const updates: any = {};

  if (user_name) updates.user_name = user_name;
  if (user_first_name) updates.user_first_name = user_first_name;
  if (user_last_name) updates.user_last_name = user_last_name;
  if (user_phone) updates.user_phone = user_phone;

  const { data, error } = await supabase
    .from('User')
    .update(updates)
    .eq('user_id', userId)
    .select('user_id, user_name, user_first_name, user_last_name, user_phone')
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}

//========== may need to update in the future since deleting a user will also delete posts, trades, and messages ==========
//DELETE deletes the logged in user's account, requires authentication
export async function deleteAccount(userId: string) {
  //delete the user from the User table, which will also cascade delete all related data in other tables
  const { error } = await supabase
    .from('User')
    .delete()
    .eq('user_id', userId);

  if (error) throw new AppError(error.message, 500);
}