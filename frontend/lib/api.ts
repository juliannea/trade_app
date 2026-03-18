import { supabase } from './supabase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  //gets the current session from supabase, which gets the access token if the user is logged in
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  patch: <T>(path: string, body: object) => apiRequest<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  post: <T>(path: string, body: object) => apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};