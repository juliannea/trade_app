import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';


export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid auth token' });
  }

  const token = authHeader.split(' ')[1]; //extract the token 

  //checks with subase that the token is valid and returns the user info if it is
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // 3. Attach the user info to the request so the route handler can use it
  req.userId = data.user.id;
  req.userEmail = data.user.email;

  next(); // token is valid, continue to the route
}