import client from './client';
import type { Flight, FlightStats } from '../types';

export const getFlight = (id: number) => client.get<Flight>(`/flights/${id}`).then(r => r.data);
export const getFlights = (page = 1, limit = 20, planeId?: number, customerId?: number, type?: string, dateFrom?: string, dateTo?: string, search?: string, instructorId?: number, studentId?: number, partnerId?: number) =>
  client.get<import('../types').PaginatedResponse<Flight>>('/flights', { params: { ...(planeId && { plane_id: planeId }), ...(customerId && { customer_id: customerId }), ...(instructorId && { instructor_id: instructorId }), ...(studentId && { student_id: studentId }), ...(partnerId && { partner_id: partnerId }), ...(type && { type }), ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }), ...(search && { search }), page, limit } }).then(r => r.data);
export const getFlightStats = (params: { studentId?: number; partnerId?: number; instructorId?: number; peopleId?: number; aircraftId?: number }) =>
  client.get<FlightStats>('/flights/stats', { params: { ...(params.studentId && { student_id: params.studentId }), ...(params.partnerId && { partner_id: params.partnerId }), ...(params.instructorId && { instructor_id: params.instructorId }), ...(params.peopleId && { people_id: params.peopleId }), ...(params.aircraftId && { aircraft_id: params.aircraftId }) } }).then(r => r.data);
export const createFlight = (data: unknown) => client.post<Flight>('/flights', data).then(r => r.data);
export const updateFlight = (id: number, data: unknown) => client.patch<Flight>(`/flights/${id}`, data).then(r => r.data);
export const closeFlight = (id: number, end_date: string) => client.patch(`/flights/${id}/close`, { end_date }).then(r => r.data);
export const deleteFlight = (id: number) => client.delete(`/flights/${id}`);
export const bulkDeleteFlights = (ids: number[]) => client.delete('/flights/bulk', { data: { ids } });
