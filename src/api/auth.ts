import client from './client';
import type { User } from '../types';

export async function login(email: string, password: string): Promise<{ user: User; access_token: string }> {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}
