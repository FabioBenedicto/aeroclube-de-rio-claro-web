import client from './client';

export interface FilterRow {
  field: string;
  operator: string;
  value?: any;
}

export interface AggregationRow {
  field: string;
  fn: string;
  alias: string;
}

export interface QueryReportPayload {
  entity: string;
  columns: string[];
  filters: FilterRow[];
  joins?: string[];
  groupBy?: string[];
  aggregations?: AggregationRow[];
  limit?: number;
}

export function runQuery(payload: QueryReportPayload): Promise<Record<string, any>[]> {
  return client.post<Record<string, any>[]>('/reports/query', payload).then(r => r.data);
}

export function exportQuery(payload: QueryReportPayload): Promise<Blob> {
  return client.post('/reports/query/export', payload, { responseType: 'blob' }).then(r => r.data);
}

export interface RawQueryPayload {
  sql: string;
}

export function runRawQuery(payload: RawQueryPayload): Promise<Record<string, any>[]> {
  return client.post<Record<string, any>[]>('/reports/raw', payload).then(r => r.data);
}

export function exportRawQuery(payload: RawQueryPayload): Promise<Blob> {
  return client.post('/reports/raw/export', payload, { responseType: 'blob' }).then(r => r.data);
}
