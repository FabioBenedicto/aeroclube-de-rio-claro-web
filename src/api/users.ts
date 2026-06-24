import client from './client';

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'USER';
  permissions?: string[];
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'USER';
  date_from?: string;
  date_to?: string;
}

export const getUsers = (params: GetUsersParams = {}) =>
  client.get<{ data: UserRecord[]; total: number; page: number; limit: number; totalPages: number }>('/users', { params }).then((r) => r.data);

export const createUser = (data: UserPayload) =>
  client.post<UserRecord>('/users', data).then((r) => r.data);

export const updateUser = (id: number, data: Partial<UserPayload>) =>
  client.patch<UserRecord>(`/users/${id}`, data).then((r) => r.data);

export const deleteUser = (id: number) =>
  client.delete(`/users/${id}`);

export const updateMe = (data: { name?: string; email?: string; password?: string; currentPassword?: string }) =>
  client.patch<UserRecord>('/users/me', data).then((r) => r.data);

export const deleteMe = () =>
  client.delete('/users/me');
