import client from './client';
import type { Customer, CreditHistory } from '../types';

export const getCustomers = () => client.get<Customer[]>('/customers').then(r => r.data);
export const getCustomer = (id: number) => client.get<Customer>(`/customers/${id}`).then(r => r.data);
export const createCustomer = (data: unknown) => client.post<Customer>('/customers', data).then(r => r.data);
export const updateCustomer = (id: number, data: unknown) => client.patch<Customer>(`/customers/${id}`, data).then(r => r.data);
export const deleteCustomer = (id: number) => client.delete(`/customers/${id}`);
export const getCustomerCredits = (customerId: number) => client.get<CreditHistory>(`/customers/${customerId}/credits`).then(r => r.data);
export const addCredit = (customerId: number, data: { amount: number; notes?: string }) => client.post(`/customers/${customerId}/credits`, data).then(r => r.data);
