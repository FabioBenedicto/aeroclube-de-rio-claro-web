import client from './client';
import type { Bill, CnabRemessa, CnabRetorno, PaginatedResponse } from '../types';

export interface RetornoResult {
  paid: number[];
  rejected: number[];
  errors: string[];
  updated: number[];
  retorno_id: number;
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
  client.post<CnabRemessa>('/cnab/remessa', { bill_ids }).then(r => r.data);

export const getRemessas = (page = 1, limit = 20) =>
  client
    .get<PaginatedResponse<CnabRemessa>>('/cnab/remessas', { params: { page, limit } })
    .then(r => r.data);

export const downloadRemessa = (id: number) =>
  client
    .get<Blob>(`/cnab/remessas/${id}/download`, { responseType: 'blob' })
    .then(r => r.data);

export const getRetornos = (page = 1, limit = 20) =>
  client
    .get<PaginatedResponse<CnabRetorno>>('/cnab/retornos', { params: { page, limit } })
    .then(r => r.data);

export const processRetorno = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post<RetornoResult>('/cnab/retorno', fd).then(r => r.data);
};
