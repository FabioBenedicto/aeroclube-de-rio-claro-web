import client from './client';
import type { ReceivableType } from '../types';

export const getReceivableTypes = () =>
  client.get<ReceivableType[]>('/receivable-types').then(r => r.data);

export const createReceivableType = (name: string) =>
  client.post<ReceivableType>('/receivable-types', { name }).then(r => r.data);

export const updateReceivableType = (id: number, name: string) =>
  client.patch<ReceivableType>(`/receivable-types/${id}`, { name }).then(r => r.data);

export const deleteReceivableType = (id: number) =>
  client.delete(`/receivable-types/${id}`);
