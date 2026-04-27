import client from './client';
import type { Receivable } from '../types';

export const getReceivables = (status?: string) => client.get<Receivable[]>('/receivables', { params: status !== undefined ? { status } : {} }).then(r => r.data);
export const createReceivable = (data: unknown) => client.post<Receivable>('/receivables', data).then(r => r.data);
export const updateReceivable = (id: number, data: unknown) => client.patch<Receivable>(`/receivables/${id}`, data).then(r => r.data);
export const deleteReceivable = (id: number) => client.delete(`/receivables/${id}`);
export const registerPayment = (id: number, data: { amount_received: number; payment_method?: string; payment_date?: string; notes?: string }) =>
  client.post(`/receivables/${id}/payments`, data).then(r => r.data);
