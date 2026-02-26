import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as UserService from '../services/userService';

export async function getOwnProfile(req: AuthRequest, res: Response) {
  try {
    const user = await UserService.getOwnProfile(req.userId!);
    res.json(user);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const user = await UserService.getUserById(req.params.id as string);
    res.json(user);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const updated = await UserService.updateProfile(req.userId!, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function deleteAccount(req: AuthRequest, res: Response) {
  try {
    await UserService.deleteAccount(req.userId!);
    res.json({ message: 'Account deleted successfully' });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}
