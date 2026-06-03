import client from './client';
import type { Person, CreditHistory, PaginatedResponse } from '../types';

export const getPeoples = (
  search?: string,
  category?: string,
  page = 1,
  limit = 20,
  dateFrom?: string,
  dateTo?: string,
) =>
  client
    .get<PaginatedResponse<Person>>('/peoples', {
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

export const getPerson = (id: number) =>
  client.get<Person>(`/peoples/${id}`).then(r => r.data);

export const createPerson = (data: unknown) =>
  client.post<Person>('/peoples', data).then(r => r.data);

export const updatePerson = (id: number, data: unknown) =>
  client.patch<Person>(`/peoples/${id}`, data).then(r => r.data);

export const deletePerson = (id: number) =>
  client.delete(`/peoples/${id}`);

export const getPeoplesStats = () =>
  client
    .get<{ total_received: number; total_paid: number; total_hours: number; total_flights: number }>(
      '/peoples/stats',
    )
    .then(r => r.data);

export const getPersonCredits = (personId: number) =>
  client.get<CreditHistory>(`/peoples/${personId}/credits`).then(r => r.data);

export const addPersonCredit = (personId: number, data: { amount: number }) =>
  client.post(`/peoples/${personId}/credits`, data).then(r => r.data);
