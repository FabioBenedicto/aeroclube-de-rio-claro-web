export function formatHours(decimal: number | string | null | undefined): string {
  const n = typeof decimal === 'string' ? parseFloat(decimal) : Number(decimal);
  if (decimal == null || isNaN(n)) return '—';
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  return `${h}h${m > 0 ? String(m).padStart(2, '0') + 'm' : ''}`;
}

export function formatBRL(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0,00';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function isOverdue(expirationDate: string | null | undefined): boolean {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date(new Date().toDateString());
}

export type ReceivableStatus = 'open' | 'partial' | 'paid' | 'overdue';
export function receivableStatus(r: { status: string; amount_received: number; total_amount: number; expiration_date?: string | null }): ReceivableStatus {
  if (r.status === 'PAID') return 'paid';
  if (r.status === 'PARTIAL' || Number(r.amount_received) > 0) return 'partial';
  if (isOverdue(r.expiration_date)) return 'overdue';
  return 'open';
}

export const STATUS_LABEL: Record<string, string> = {
  open: 'A receber',
  partial: 'Parcial',
  paid: 'Pago',
  overdue: 'Vencido',
};

export const STATUS_BADGE: Record<string, string> = {
  open: 'warn',
  partial: 'accent',
  paid: 'success',
  overdue: 'danger',
};

export type BillStatus = 'open' | 'pending_cnab' | 'paid' | 'cancelled';

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  open:         'Em aberto',
  pending_cnab: 'Aguardando CNAB',
  paid:         'Pago',
  cancelled:    'Cancelado',
};

export const BILL_STATUS_BADGE: Record<BillStatus, 'success' | 'warn' | 'danger' | 'accent'> = {
  open:         'warn',
  pending_cnab: 'accent',
  paid:         'success',
  cancelled:    'danger',
};

export function payableStatus(p: { status: string; amount_paid: number; total_amount: number; expiration_date?: string | null }): ReceivableStatus {
  if (p.status === 'PAID') return 'paid';
  if (p.status === 'PARTIAL' || Number(p.amount_paid) > 0) return 'partial';
  if (isOverdue(p.expiration_date)) return 'overdue';
  return 'open';
}

export const PAYABLE_STATUS_LABEL: Record<ReceivableStatus, string> = {
  open:    'A pagar',
  partial: 'Parcial',
  paid:    'Pago',
  overdue: 'Vencido',
};

export type UserRole = 'ADMIN' | 'USER';

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  USER:  'Usuário',
};

export const USER_ROLE_BADGE: Record<UserRole, 'accent' | 'default'> = {
  ADMIN: 'accent',
  USER:  'default',
};
