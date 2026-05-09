import client from './client';

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'EMPLOYEE';
  permissions?: string[];
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export const getUsers = () =>
  client.get<UserRecord[]>('/users').then((r) => r.data);

export const createUser = (data: UserPayload) =>
  client.post<UserRecord>('/users', data).then((r) => r.data);

export const updateUser = (id: number, data: Partial<UserPayload>) =>
  client.patch<UserRecord>(`/users/${id}`, data).then((r) => r.data);

export const deleteUser = (id: number) =>
  client.delete(`/users/${id}`);
