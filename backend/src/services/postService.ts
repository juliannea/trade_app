import { supabase } from '../supabase';

class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

//INSERT a new post for a user 
export async function insertPost(
  userId: string,
  file: Express.Multer.File,
  post_title: string,
  post_caption: string,
  collection_id: number, 
){
  //builds the file path for the uploaded image thats scoped to the user 
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}-${file.originalname}`;

  //uploading the image to supabase storage 
  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype, //determines & sets if jpg or png
      upsert: false, //prevents overwriting existing files with the sames name
    });

  if (uploadError) throw new AppError(uploadError.message, 500);

  //get the public URL of the uploaded image 
  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath);

  //insert in the Post row the users new post 
  const {data, error: insertError} = await supabase
    .from('Post')
    .insert({
      collection_id,
      user_id: userId,
      post_title,
      post_image_url: publicUrl,
      post_caption,
    })
    .select()
    .single();
  
  if (insertError) throw new AppError(insertError.message, 500);
  return data;

}

//GET returns all created posts of the logged in user, requires authentication 
export async function getOwnPosts(userId: string) {
  const {data, error} = await supabase
    .from('Post')
    .select('post_id, collection_id, post_title, post_image_url, post_caption')
    .eq('user_id', userId);

  if (error) throw new AppError(error.message, 500);
  if (!data)  throw new AppError('No posts found', 404);
  return data;
}

//GET returns all created posts of a specific collection, requires authentication 
export async function getPostsByCollection(collectionId: number) {
  const { data, error } = await supabase
    .from('Post')
    .select('post_id, collection_id, user_id, post_title, post_image_url, post_caption')
    .eq('collection_id', collectionId);

  if (error) throw new AppError(error.message, 500);
  if (!data || data.length === 0) throw new AppError('No posts found for this collection', 404);
  return data;
}

//DELETE a post by the post_id, requires authentication   
export async function deletePost(postId: number) {
  const { error } = await supabase
    .from('Post')
    .delete()
    .eq('post_id', postId);
  
  if (error) throw new AppError(error.message, 500);
}