import client from './client';
import type { Receivable } from '../types';

export const getReceivables = (status?: string, search?: string, dateFrom?: string, dateTo?: string, page = 1, limit = 20, peopleId?: number) =>
  client.get<import('../types').PaginatedResponse<Receivable>>('/receivables', { params: { ...(status !== undefined && { status }), ...(search && { search }), ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }), ...(peopleId && { people_id: peopleId }), page, limit } }).then(r => r.data);
export const getReceivable = (id: number) => client.get<Receivable>(`/receivables/${id}`).then(r => r.data);
export const createReceivable = (data: unknown) => client.post<Receivable>('/receivables', data).then(r => r.data);
export const updateReceivable = (id: number, data: unknown) => client.patch<Receivable>(`/receivables/${id}`, data).then(r => r.data);
export const deleteReceivable = (id: number) => client.delete(`/receivables/${id}`);
export const bulkDeleteReceivables = (ids: number[]) => client.delete('/receivables/bulk', { data: { ids } });
export const registerPayment = (id: number, data: { amount_received: number; payment_method?: string; payment_date?: string; use_credit?: boolean }) =>
  client.post(`/receivables/${id}/payments`, data).then(r => r.data);
export const deletePayment = (receivableId: number, paymentId: number) =>
  client.delete(`/receivables/${receivableId}/payments/${paymentId}`);
export const uploadPaymentNotaFiscal = (receivableId: number, paymentId: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post(`/receivables/${receivableId}/payments/${paymentId}/invoice`, fd).then(r => r.data);
};
export const deletePaymentNotaFiscal = (receivableId: number, paymentId: number) =>
  client.delete(`/receivables/${receivableId}/payments/${paymentId}/invoice`);
