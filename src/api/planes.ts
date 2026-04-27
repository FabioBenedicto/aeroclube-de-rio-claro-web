import client from './client';
import type { Plane } from '../types';

export const getPlanes = () => client.get<Plane[]>('/planes').then(r => r.data);
export const getPlane = (id: number) => client.get<Plane>(`/planes/${id}`).then(r => r.data);
export const createPlane = (data: unknown) => client.post<Plane>('/planes', data).then(r => r.data);
export const updatePlane = (id: number, data: unknown) => client.put<Plane>(`/planes/${id}`, data).then(r => r.data);
