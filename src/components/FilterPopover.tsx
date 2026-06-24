import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface Props {
  activeCount: number;
  onClear: () => void;
  children: React.ReactNode;
}

export default function FilterPopover({ activeCount, onClear, children }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const PANEL_WIDTH = 288;
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number }>({ top: 0, left: 0 });

  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const top = r.bottom + 6;
      const spaceRight = window.innerWidth - r.left;
      if (spaceRight >= PANEL_WIDTH) {
        setCoords({ top, left: r.left });
      } else {
        setCoords({ top, right: window.innerWidth - r.right });
      }
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border cursor-pointer transition-[background,border-color] duration-[80ms] whitespace-nowrap',
          activeCount > 0
            ? 'bg-bg-elev border-accent text-accent-ink'
            : 'bg-bg-elev border-line text-ink-2 hover:bg-bg-hover hover:text-ink hover:border-line-strong',
        )}
        onClick={toggle}
      >
        <SlidersHorizontal size={14} />
        Filtros
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-bg-elev border border-line rounded-lg shadow-[var(--shadow)] p-3.5 pb-3.5"
          style={{
            top: coords.top,
            width: PANEL_WIDTH,
            ...(coords.left !== undefined ? { left: coords.left } : { right: coords.right }),
          }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">Filtros</span>
            <button
              className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
              onClick={() => setOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {children}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-3 cursor-pointer hover:bg-bg-hover"
              onClick={() => { onClear(); setOpen(false); }}
            >
              Limpar
            </button>
            <button
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-ink bg-ink text-bg cursor-pointer hover:opacity-85"
              onClick={() => setOpen(false)}
            >
              Aplicar
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
