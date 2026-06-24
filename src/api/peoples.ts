import client from './client';
import type { People, PaginatedResponse } from '../types';

export const getPeoples = (
  search?: string,
  category?: string,
  page = 1,
  limit = 20,
  dateFrom?: string,
  dateTo?: string,
) =>
  client
    .get<PaginatedResponse<People>>('/peoples', {
      params: {
        ...(search   && { search }),
        ...(category && { category }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo   && { date_to:   dateTo   }),
        page,
        limit,
      },
    })
    .then(r => r.data);

export const getPeople = (id: number) =>
  client.get<People>(`/peoples/${id}`).then(r => r.data);

export const createPeople = (data: unknown) =>
  client.post<People>('/peoples', data).then(r => r.data);

export const updatePeople = (id: number, data: unknown) =>
  client.patch<People>(`/peoples/${id}`, data).then(r => r.data);

export const deletePeople = (id: number) =>
  client.delete(`/peoples/${id}`);

export const bulkDeletePeoples = (ids: number[]) =>
  client.delete('/peoples/bulk', { data: { ids } });

export const getPeoplesStats = () =>
  client
    .get<{ total_received: number; total_paid: number; total_hours: number; total_flights: number }>(
      '/peoples/stats',
    )
    .then(r => r.data);

