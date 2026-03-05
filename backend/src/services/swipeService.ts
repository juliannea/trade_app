import {supabase} from '../supabase';

class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

export async function swipe(userId: string, postId: string, direction: 'LEFT' | 'RIGHT') {
   //Check if post exists and get the post owner's user_id
   const {data: post, error: postError} = await supabase
      .from('Post')
      .select('user_id')
      .eq('post_id', postId)
      .single();

   //Error handling 
   if (postError) throw new AppError(postError.message, 500);
   //if post doesn't exist, post will be null and we can throw a 404 error --> cannot swipe on a post that doesn't exist
   if (!post) throw new AppError('Post not found', 404);
   //if user tries to swipe on their own post, throw a 400 error --> cannot swipe on your own post
   if (post.user_id === userId) throw new AppError('Cannot swipe on your own post', 400);

   const {data: existingSwipe, error: swipeError} = await supabase
   //Check if user has already swiped on this post by looking for an existing swipe with the same user_id of the swiper and post_id of the post being swiped on
      .from('Swipe')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single(); 
      
   //Error handling for swipe query. 
   //if there's an error with the query itself, throw a 500 error. 
   if (swipeError) throw new AppError(swipeError.message, 500);
   //if the query returns a swipe, that means the user has already swiped on this post, so we throw a 400 error --> cannot swipe on the same post more than once
   if (existingSwipe) throw new AppError('Already swiped on this post', 400);

   //base cases passed, we can insert the swipe into the database
   const {error: insertError} = await supabase
      .from('Swipe')
      .insert({ user_id: userId, post_id: postId, direction });
      
   if (insertError) throw new AppError(insertError.message, 500);

  
}