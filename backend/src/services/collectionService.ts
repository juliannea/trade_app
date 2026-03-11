import { supabase } from '../supabase';

export class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

//GET returns all collections, requires authentication 
export async function getAllCollections() {
  const {data, error} = await supabase
    .from('Collection')
    .select('collection_id, collection_name');

  if (error) throw new AppError(error.message, 500);
  return data;
}