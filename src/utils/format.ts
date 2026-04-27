export function formatBRL(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0,00';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function isOverdue(expirationDate: string): boolean {
  return new Date(expirationDate) < new Date(new Date().toDateString());
}

// Compute display status for Receivable (backend only stores 0/1)
export type ReceivableStatus = 'open' | 'partial' | 'paid' | 'overdue';
export function receivableStatus(r: { status: number; amount_received: number; total_amount: number; expiration_date: string }): ReceivableStatus {
  if (r.status === 1) return 'paid';
  if (Number(r.amount_received) > 0) return 'partial';
  if (isOverdue(r.expiration_date)) return 'overdue';
  return 'open';
}

export const STATUS_LABEL: Record<string, string> = {
  open: 'Em aberto',
  partial: 'Parcial',
  paid: 'Pago',
  overdue: 'Vencido',
  'in-flight': 'Registrado',
  closed: 'Encerrado',
  cancelled: 'Cancelado',
};

export const STATUS_BADGE: Record<string, string> = {
  open: 'warn',
  partial: 'accent',
  paid: 'success',
  overdue: 'danger',
  'in-flight': 'accent',
  closed: 'success',
  cancelled: 'default',
};
