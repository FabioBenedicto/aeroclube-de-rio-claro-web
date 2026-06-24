import client from './client';
import type { PayableType } from '../types';

export const getPayableTypes = () =>
  client.get<PayableType[]>('/payable-types').then(r => r.data);

export const createPayableType = (name: string) =>
  client.post<PayableType>('/payable-types', { name }).then(r => r.data);

export const updatePayableType = (id: number, name: string) =>
  client.patch<PayableType>(`/payable-types/${id}`, { name }).then(r => r.data);

export const deletePayableType = (id: number) =>
  client.delete(`/payable-types/${id}`);
