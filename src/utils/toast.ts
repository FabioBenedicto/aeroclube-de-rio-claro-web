type ToastType = 'error' | 'success' | 'warning';

export interface ToastEvent {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (event: ToastEvent) => void;

let _id = 0;
const listeners: Set<Listener> = new Set();

export const toast = {
  error: (message: string) => emit(message, 'error'),
  success: (message: string) => emit(message, 'success'),
  warning: (message: string) => emit(message, 'warning'),
  subscribe: (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); },
};

function emit(message: string, type: ToastType) {
  const event: ToastEvent = { id: ++_id, message, type };
  listeners.forEach(fn => fn(event));
}

export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: unknown } } }).response;
    const msg = res?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado';
}
