import {supabase} from '../supabase';

class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

export async function swipe(userId: string, postId: string, direction: 'LEFT' | 'RIGHT') {
   console.log('swipe called with:', userId, postId, direction)

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
   if (swipeError && swipeError.code !== 'PGRST116') throw new AppError(swipeError.message, 500);
   //if the query returns a swipe, that means the user has already swiped on this post, so we throw a 400 error --> cannot swipe on the same post more than once
   if (existingSwipe) throw new AppError('Already swiped on this post', 400);

   const {data: user} = await supabase
      .from('User')
      .select('user_name')
      .eq('user_id', userId)
      .single();

   //base cases passed, we can insert the swipe into the database
   const {error: insertError} = await supabase
      .from('Swipe')
      .insert({ user_id: userId, post_id: postId, swipe_direction: direction, user_name: user?.user_name });
      
   if (insertError) throw new AppError(insertError.message, 500);

   if (direction === 'RIGHT') {
      await checkForMatch(userId, post.user_id);
   }

   return { success: true };
}



// get all swipes by the current user (used to filter feed)
export async function getUserSwipes(userId: string) {
   const {data, error} = await supabase
      .from('Swipe')
      .select('post_id, swipe_direction')
      .eq('user_id', userId);

   if (error) throw new AppError(error.message, 500);
   return data;
}


//=============================== needs to fix==============================
async function checkForMatch(swiperId: string, postOwnerId: string) {
   // get all of the swiper user's posts
   const {data:myPosts} = await supabase
      .from('Post')
      .select('post_id')
      .eq('user_id', swiperId);

   // if user has no posts they can't be matched
   if (!myPosts || myPosts.length === 0) return;

   console.log('myPosts:', myPosts);

   const {data:mutualSwipe} = await supabase
      .from('Swipe')
      .select('user_id')
      .eq('user_id', postOwnerId)
      .in('post_id', myPosts.map(post => post.post_id))  // transform the array of posts into an array of post_ids to check if the post owner has swiped right on any of the swiper user's posts
      .eq('swipe_direction', 'RIGHT')
      .limit(1) // we only need to find one mutual swipe to confirm a match, so we can limit the query to 1 result
      
   console.log('mutualSwipe:', mutualSwipe);   
   // if the post owner hasn't swiped right on any of the current user's posts, then there's no match
   if (!mutualSwipe) return;

   // before creating a match, check if a match already exists between these two users to avoid duplicate matches
   const {data: existingMatch} = await supabase
      .from('Match')
      .select('match_id')
      .or(`and(user_id_a.eq.${swiperId},user_id_b.eq.${postOwnerId}),and(user_id_a.eq.${postOwnerId},user_id_b.eq.${swiperId})`)
      .single();

   console.log('existingMatch:', existingMatch);

   if (existingMatch) return;



  const { error } = await supabase.from('Match').insert({
      matched_at: new Date(),
      user_id_a: swiperId,
      user_id_b: postOwnerId,
      match_status: 'ACTIVE'
   });

   console.log('Match creation error:', error);

   console.log('Match created between', swiperId, 'and', postOwnerId);
   
}