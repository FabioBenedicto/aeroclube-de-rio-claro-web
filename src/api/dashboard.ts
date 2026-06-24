import client from './client';

export interface DashboardSummary {
  receivables: { total: number; open: number };
  payables: { total: number; open: number };
  flights: { today: number; in_flight: number };
  customers: number;
}

export const getDashboard = () =>
  client.get<DashboardSummary>('/dashboard').then(r => r.data);
