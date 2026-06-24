import client from './client';
import type { Plane } from '../types';

export const getPlanes = (page = 1, limit = 20, dateFrom?: string, dateTo?: string, search?: string, aircraftType?: string) =>
  client.get<import('../types').PaginatedResponse<Plane>>('/aircraft', { params: { ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }), ...(search && { search }), ...(aircraftType && { aircraft_type: aircraftType }), page, limit } }).then(r => r.data);
export const getPlane = (id: number) => client.get<Plane>(`/aircraft/${id}`).then(r => r.data);
export const createPlane = (data: unknown) => client.post<Plane>('/aircraft', data).then(r => r.data);
export const updatePlane = (id: number, data: unknown) => client.put<Plane>(`/aircraft/${id}`, data).then(r => r.data);
export const deletePlane = (id: number) => client.delete(`/aircraft/${id}`);
export const bulkDeletePlanes = (ids: number[]) => client.delete('/aircraft/bulk', { data: { ids } });
