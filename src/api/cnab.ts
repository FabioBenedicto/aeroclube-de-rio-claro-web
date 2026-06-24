import client from './client';
import type { Bill, CnabRemessa, PaginatedResponse } from '../types';

export const getBillsPending = (
  page = 1,
  limit = 20,
  dueFrom?: string,
  dueTo?: string,
) =>
  client
    .get<PaginatedResponse<Bill>>('/bills', {
      params: {
        status: 'open',
        page,
        limit,
        ...(dueFrom && { due_from: dueFrom }),
        ...(dueTo && { due_to: dueTo }),
      },
    })
    .then(r => r.data);

export const createBoletoBill = (data: {
  customer_id: number;
  total_amount: number;
  due_date: string;
}) => client.post<Bill>('/bills/boleto', data).then(r => r.data);

export const generateRemessa = (bill_ids: number[]) =>
  client.post<CnabRemessa>('/cnab/remittent', { bill_ids }).then(r => r.data);

export const getRemessa = (id: number) =>
  client.get<import('../types').CnabRemessa>(`/cnab/remittent/${id}`).then(r => r.data);

export const getRemessas = (page = 1, limit = 20) =>
  client
    .get<PaginatedResponse<CnabRemessa>>('/cnab/remittent', { params: { page, limit } })
    .then(r => r.data);

export const downloadRemessa = (id: number) =>
  client
    .get<Blob>(`/cnab/remittent/${id}/download`, { responseType: 'blob' })
    .then(r => r.data);

export const deleteRemessa = (id: number) =>
  client.delete(`/cnab/remittent/${id}`).then(r => r.data);

