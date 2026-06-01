import client from './client';
import type { Settings } from '../types';

export const getSettings = () =>
  client.get<Settings>('/settings').then(r => r.data);

export const upsertSettings = (data: Partial<Settings>) =>
  client.put<Settings>('/settings', data).then(r => r.data);
