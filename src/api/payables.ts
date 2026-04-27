import client from './client';
import type { Payable } from '../types';

export const getPayables = (status?: string) => client.get<Payable[]>('/payables', { params: status ? { status } : {} }).then(r => r.data);
export const createPayable = (data: unknown) => client.post<Payable>('/payables', data).then(r => r.data);
export const updatePayable = (id: number, data: unknown) => client.patch<Payable>(`/payables/${id}`, data).then(r => r.data);
export const deletePayable = (id: number) => client.delete(`/payables/${id}`);
export const registerPayablePayment = (id: number, data: { amount: number; method?: string; paid_at?: string; notes?: string }) =>
  client.patch(`/payables/${id}/payments`, data).then(r => r.data);
