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
    .select(`post_id, collection_id, post_title, post_image_url, post_caption,
      Collection!Post_collection_id_fkey(
        collection_name
      )`) 
      //collection join to get the collection name for each post in the users profile feed
    .eq('user_id', userId);

  if (error) throw new AppError(error.message, 500);
  if (!data)  throw new AppError('No posts found', 404);
  return data;
}

//GET returns all created posts of a specific collection, requires authentication 
export async function getPostsByCollection(collectionIds: number[] | null, userId: string) {
  //find every post the user had already swiped on 
  const {data: swipedPosts } = await supabase
    .from('Swipe')
    .select('post_id')
    .eq('user_id', userId);
  
  const swipedPostIds = swipedPosts?.map(s => s.post_id) ?? [];

  //find every post part of a pending or completed trade 
  const{ data: trades } = await supabase
    .from('Trade')
    .select('post_id_a, post_id_b')
    .in('trade_status', ['PENDING', 'COMPLETE']);
  
  const tradedPostIds = trades?.flatMap(t => [t.post_id_a, t.post_id_b]) ?? [];

  //add all the posts to ignore in one array
  const ignoreIds = [... new Set([...swipedPostIds, tradedPostIds])];

  let query = supabase
    .from('Post')
    .select(
      `post_id, collection_id, post_title, post_image_url, post_caption,
      User!Post_user_id_fkey(  
        user_name
      ),
      Collection!Post_collection_id_fkey(
        collection_name
      )`
    )
    //user join to get the user_name of the post creator and collection join to get the collection name for each post in the feed
    .neq('user_id', userId); //exclude the users own posts from the collection feed

  //collections filter 
  if (collectionIds && collectionIds.length > 0){
    query = query.in('collection_id', collectionIds);
  }


  if (ignoreIds.length > 0) {
    query = query.not('post_id', 'in', `(${ignoreIds.join(',')})`);
  }

  const {data, error} = await query;

  if (error) throw new AppError(error.message, 500);
  return data ?? [];
}

//DELETE a post by the post_id, requires authentication   
export async function deletePost(postId: number) {
  //find the image path of the post 
  const { data: post, error: fetchError } = await supabase
    .from('Post')
    .select('post_image_url')
    .eq('post_id', postId)
    .single();


  if (fetchError) throw new AppError(fetchError.message, 500);

  //delete the file from supabase storage 
  if (post?.post_image_url) {
    //extract path relative to bucket
    const bucketPath = post.post_image_url.split('/post-images/')[1];

    const { error: storageError } = await supabase.storage
      .from('post-images')
      .remove([bucketPath]);

    if (storageError) throw new AppError(storageError.message, 500);
  }

  const { error } = await supabase
    .from('Post')
    .delete()
    .eq('post_id', postId);
  
  if (error) throw new AppError(error.message, 500);
}

//GET returns all the posts the the user liked from another user they're matched with 
export async function getLikedPostsFromMatch(userId: string, matchId: number) {

  //check that a match exists between the logged in user and the other user
  const { data: match, error: matchError } = await supabase
    .from('Match')
    .select('user_id_a, user_id_b')
    .eq('match_id', matchId)
    .single();

  if (matchError || !match) throw new AppError('Match not found', 404);
  if (match.user_id_a !== userId && match.user_id_b !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  //identify the other user
  const otherUserId = match.user_id_a === userId ? match.user_id_b : match.user_id_a;

  //find all the liked posts of the other user on the Swipe table 
  const { data: swipes, error: swipeError } = await supabase
    .from('Swipe')
    .select('post_id')
    .eq('user_id', userId)
    .eq('swipe_direction', 'RIGHT');

  if (swipeError) throw new AppError(swipeError.message, 500);

  //store all the liked posts in a array
  const likedPostIds = swipes?.map(s => s.post_id) ?? [];
  if (likedPostIds.length === 0) return [];

  //find every post part of a pending or completed trade 
  const{ data: trades } = await supabase
    .from('Trade')
    .select('post_id_a, post_id_b')
    .in('trade_status', ['PENDING', 'COMPLETE']);
  
  const tradedPostIds = trades?.flatMap(t => [t.post_id_a, t.post_id_b]) ?? [];

  let query = supabase
    .from('Post')
    .select(
      `post_id, post_title, post_image_url, post_caption, user_id,
      User!Post_user_id_fkey(  
        user_name
      ),
      Collection!Post_collection_id_fkey(
      collection_name
      )`
    )
    .eq('user_id', otherUserId)
    .in('post_id', likedPostIds)
    
  if (tradedPostIds.length > 0) {
    query = query.not('post_id', 'in', `(${tradedPostIds.join(',')})`);
  }

  const {data, error} = await query;


  if (error) throw new AppError(error.message, 500);
  return data ?? [];
}