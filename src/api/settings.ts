import client from './client';
import type { Settings, SicoobConfig } from '../types';

export const getSettings = () =>
  client.get<Settings>('/settings').then(r => r.data);

export const upsertSettings = (data: Partial<Settings>) =>
  client.put<Settings>('/settings', data).then(r => r.data);

export const getSicoobConfig = () =>
  client.get<SicoobConfig>('/settings/sicoob').then(r => r.data);

export const upsertSicoobConfig = (data: Partial<SicoobConfig>) =>
  client.put<SicoobConfig>('/settings/sicoob', data).then(r => r.data);
