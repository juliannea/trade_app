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
    .select('user_id, user_name, user_first_name, user_last_name, user_email, user_phone, user_profile_image, user_created_at, user_bio')
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
    .select('user_id, user_name, user_first_name, user_last_name, user_profile_image, user_created_at, user_bio')
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
    user_bio
  }: {
    user_name?: string;
    user_first_name?: string;
    user_last_name?: string;
    user_phone?: string;
    user_bio?: string;
  }) {

  const updates: any = {};

  if (user_name) updates.user_name = user_name;
  if (user_first_name) updates.user_first_name = user_first_name;
  if (user_last_name) updates.user_last_name = user_last_name;
  if (user_phone) updates.user_phone = user_phone;
  if (user_bio) updates.user_bio = user_bio;

  const { data, error } = await supabase
    .from('User')
    .update(updates)
    .eq('user_id', userId)
    .select('user_id, user_name, user_first_name, user_last_name, user_phone, user_bio')
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

//UPDATE profile picture 
export async function updateProfilePic(userID: string, file:Express.Multer.File) {
  //build the file parth for supabase storage 
  const timestamp = Date.now();
  const filePath = `${userID}/profile-picture`;

  //upload the image to supabase storage 
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype, //determines & sets if jpg or png
      upsert: true, //overwrite if already exists
    });
  
  if (uploadError) throw new AppError(uploadError.message, 500);

  //get the public URL of the uploaded image 
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  //insert in the User.user_profile_image column of logged in user 
  const {data, error: insertError} = await supabase
    .from('User')
    .update({
      user_profile_image: publicUrl
    })
    .eq('user_id', userID)
    .select('user_profile_image')
    .single();
  
  if (insertError) throw new AppError(insertError.message, 500);
  return data;
}

//DELETE profile pic and change it back to null value in the column, if users don't want a picture
export async function deleteProfilePic(userID: string) {
  const filePath = `${userID}/profile-picture`;

  //delete from supabase storage
  const { error: storageError } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (storageError) throw new AppError(storageError.message, 500);

  //set column to null
  const { data, error } = await supabase
    .from('User')
    .update({ user_profile_image: null })
    .eq('user_id', userID)
    .select('user_profile_image')
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
}
