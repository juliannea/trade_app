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


export async function resetAll(req: AuthRequest, res: Response) {
  const errors: string[] = [];

  //get all post image URLs before deleting rows
  const { data: posts, error: fetchError } = await supabase
    .from('Post')
    .select('post_image_url');

  if (fetchError) {
    return res.status(500).json({ error: `Failed to fetch posts: ${fetchError.message}` });
  }

  //find all the storage paths and bulk-delete images from Supabase Storage
  if (posts && posts.length > 0) {
    const storagePaths = posts
      .map(p => p.post_image_url?.split('/post-images/')[1])
      .filter(Boolean) as string[];

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('post-images')
        .remove(storagePaths);

      if (storageError) {
        errors.push(`Storage cleanup partial error: ${storageError.message}`);
      }
    }
  }

  //clear all the tables
  const tableClears: { table: string; column: string }[] = [
    { table: 'Match', column: 'match_id' },
    { table: 'Swipe', column: 'post_id' },
    { table: 'Post',  column: 'post_id' },
  ];

  for (const { table, column } of tableClears) {
    const { error } = await supabase.from(table).delete().neq(column, 0);
    if (error) errors.push(`Failed to clear ${table}: ${error.message}`);
  }

  if (errors.length > 0) {
    return res.status(207).json({
      message: 'Reset completed with some errors',
      errors,
    });
  }

  res.json({ message: 'Post, Swipes, and Matches cleared' });
}