import client from './client';
import { toast } from '../utils/toast';

function timestampedFilename(filename: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? `${filename}-${stamp}` : `${filename.slice(0, dot)}-${stamp}${filename.slice(dot)}`;
}

export async function downloadReport(path: string, filename: string) {
  try {
    const res = await client.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = timestampedFilename(filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: unknown) {
    const message = await extractBlobErrorMessage(err);
    toast.error(message);
    throw err;
  }
}

async function extractBlobErrorMessage(err: unknown): Promise<string> {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: unknown } }).response;
    if (res?.data instanceof Blob) {
      try {
        const text = await res.data.text();
        const json = JSON.parse(text) as { message?: unknown };
        const msg = json.message;
        if (Array.isArray(msg)) return msg.join(', ');
        if (typeof msg === 'string') return msg;
      } catch {
        // not JSON — fall through
      }
    }
    if (res?.data && typeof res.data === 'object' && 'message' in res.data) {
      const msg = (res.data as { message?: unknown }).message;
      if (typeof msg === 'string') return msg;
    }
  }
  if (err instanceof Error) return err.message;
  return 'Erro ao gerar relatório';
}
