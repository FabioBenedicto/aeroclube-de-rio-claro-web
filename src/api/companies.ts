import client from './client';
import type { Company, PaginatedResponse } from '../types';

export const getCompanies = (search?: string, page = 1, limit = 20, dateFrom?: string, dateTo?: string) =>
  client.get<PaginatedResponse<Company>>('/companies', { params: { ...(search && { search }), ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }), page, limit } }).then(r => r.data);

export const getCompany = (id: number) =>
  client.get<Company>(`/companies/${id}`).then(r => r.data);

export const createCompany = (data: unknown) =>
  client.post<Company>('/companies', data).then(r => r.data);

export const updateCompany = (id: number, data: unknown) =>
  client.patch<Company>(`/companies/${id}`, data).then(r => r.data);

export const deleteCompany = (id: number) =>
  client.delete(`/companies/${id}`);

export const bulkDeleteCompanies = (ids: number[]) =>
  client.delete('/companies/bulk', { data: { ids } });
