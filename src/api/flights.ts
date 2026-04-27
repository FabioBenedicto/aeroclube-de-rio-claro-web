import client from './client';
import type { Flight } from '../types';

export const getFlights = (status?: string) => client.get<Flight[]>('/flights', { params: status ? { status } : {} }).then(r => r.data);
export const createFlight = (data: unknown) => client.post<Flight>('/flights', data).then(r => r.data);
export const closeFlight = (id: number, end_date: string) => client.patch(`/flights/${id}/close`, { end_date }).then(r => r.data);
export const cancelFlight = (id: number) => client.patch(`/flights/${id}/cancel`).then(r => r.data);
export const deleteFlight = (id: number) => client.delete(`/flights/${id}`);
