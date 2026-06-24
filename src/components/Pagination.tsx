import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export default function Pagination({ page, totalPages, total, limit, onChange }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-line text-[12px] text-ink-3">
      <span>{from}–{to} de {total}</span>
      <div className="flex gap-0.5">
        <button
          className={cn('flex items-center justify-center min-w-[28px] h-7 px-1.5 border border-line rounded-[5px] text-[12px] cursor-pointer', page <= 1 && 'opacity-40 cursor-default')}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={13} />
        </button>
        {pageNumbers(page, totalPages).map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1.5 py-1 text-ink-3">…</span>
            : <button
                key={p}
                className={cn(
                  'flex items-center justify-center min-w-[28px] h-7 px-1.5 border rounded-[5px] text-[12px] cursor-pointer',
                  p === page ? 'bg-accent border-accent text-white font-semibold' : 'bg-bg border-line',
                )}
                onClick={() => onChange(p as number)}
              >
                {p}
              </button>
        )}
        <button
          className={cn('flex items-center justify-center min-w-[28px] h-7 px-1.5 border border-line rounded-[5px] text-[12px] cursor-pointer', page >= totalPages && 'opacity-40 cursor-default')}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
