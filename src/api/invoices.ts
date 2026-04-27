import client from './client';
import type { Bill } from '../types';

export const getBills = () => client.get<Bill[]>('/bills').then(r => r.data);
export const getBill = (id: number) => client.get<Bill>(`/bills/${id}`).then(r => r.data);
export const createBill = (data: { customer_id: number; items: { receivable_id: number; amount: number }[] }) =>
  client.post<Bill>('/bills', data).then(r => r.data);
export const updateBill = (id: number, data: unknown) => client.patch<Bill>(`/bills/${id}`, data).then(r => r.data);
export const registerBillPayment = (id: number, data: unknown) => client.post(`/bills/${id}/payments`, data).then(r => r.data);
