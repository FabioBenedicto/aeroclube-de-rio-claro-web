import client from './client';
import type { Bill } from '../types';

export const getBills = (page = 1, limit = 20, dateFrom?: string, dateTo?: string) =>
  client.get<import('../types').PaginatedResponse<Bill>>('/bills', { params: { page, limit, ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }) } }).then(r => r.data);
export const getBillsByCustomer = (peopleId: number, page = 1, limit = 20, dateFrom?: string, dateTo?: string) =>
  client.get<import('../types').PaginatedResponse<Bill>>('/bills', { params: { people_id: peopleId, page, limit, ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }) } }).then(r => r.data);
export const getBill = (id: number) => client.get<Bill>(`/bills/${id}`).then(r => r.data);
export const createBill = (data: { people_id: number; items: { receivable_id: number; amount: number }[]; expiration_date: string }) =>
  client.post<Bill>('/bills', data).then(r => r.data);
export const payBill = (id: number, data: { payment_method: string; payment_date: string; use_credit?: boolean }) =>
  client.post<Bill>(`/bills/${id}/pay`, data).then(r => r.data);
export const deleteBill = (id: number) => client.delete(`/bills/${id}`);
export const bulkDeleteBills = (ids: number[]) => client.delete('/bills/bulk', { data: { ids } });
export const updateBill = (id: number, data: unknown) => client.patch<Bill>(`/bills/${id}`, data).then(r => r.data);
export const uploadBillNotaFiscal = (id: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post(`/bills/${id}/invoice`, fd).then(r => r.data);
};
export const deleteBillNotaFiscal = (id: number) => client.delete(`/bills/${id}/invoice`);
