import client from './client';
import type { Payable, PayableStats } from '../types';

export const getPayables = (status?: string, page = 1, limit = 20, clientId?: number, search?: string, dateFrom?: string, dateTo?: string, instructorId?: number, employeeId?: number) =>
  client.get<import('../types').PaginatedResponse<Payable>>('/payables', { params: { ...(status && { status }), ...(clientId && { person_id: clientId }), ...(instructorId && { instructor_id: instructorId }), ...(employeeId && { employee_id: employeeId }), ...(search && { search }), ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }), page, limit } }).then(r => r.data);
export const getPayableStats = (params: { personId?: number; instructorId?: number; employeeId?: number }) =>
  client.get<PayableStats>('/payables/stats', { params: { ...(params.personId && { person_id: params.personId }), ...(params.instructorId && { instructor_id: params.instructorId }), ...(params.employeeId && { employee_id: params.employeeId }) } }).then(r => r.data);
export const getPayable = (id: number) => client.get<Payable>(`/payables/${id}`).then(r => r.data);
export const createPayable = (data: unknown) => client.post<Payable>('/payables', data).then(r => r.data);
export const updatePayable = (id: number, data: unknown) => client.patch<Payable>(`/payables/${id}`, data).then(r => r.data);
export const deletePayable = (id: number) => client.delete(`/payables/${id}`);
export const bulkDeletePayables = (ids: number[]) => client.delete('/payables/bulk', { data: { ids } });
export const registerPayablePayment = (id: number, data: { amount: number; method?: string; payment_date?: string; notes?: string }) =>
  client.patch(`/payables/${id}/payments`, data).then(r => r.data);
export const deletePayablePayment = (payableId: number, paymentId: number) =>
  client.delete(`/payables/${payableId}/payments/${paymentId}`);
export const uploadPayablePaymentNotaFiscal = (payableId: number, paymentId: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post(`/payables/${payableId}/payments/${paymentId}/invoice`, fd).then(r => r.data);
};
export const deletePayablePaymentNotaFiscal = (payableId: number, paymentId: number) =>
  client.delete(`/payables/${payableId}/payments/${paymentId}/invoice`);
