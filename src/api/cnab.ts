import client from './client';
import type { Bill, PaginatedResponse } from '../types';

export interface RetornoResult {
  paid: number[];
  rejected: number[];
  errors: string[];
  updated: number[];
}

export const getBillsPending = (
  page = 1,
  limit = 20,
  dueFrom?: string,
  dueTo?: string,
) =>
  client
    .get<PaginatedResponse<Bill>>('/bills', {
      params: {
        pending: 'true',
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
  client
    .post<Blob>('/cnab/remessa', { bill_ids }, { responseType: 'blob' })
    .then(r => r.data);

export const processRetorno = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post<RetornoResult>('/cnab/retorno', fd).then(r => r.data);
};
