import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  top: number;
  triggerTop?: number;
  right: number;
  onClose: () => void;
  children: ReactNode;
}

export default function RowMenu({ top, triggerTop, right, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [menuH, setMenuH] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    if (ref.current) {
      const h = ref.current.offsetHeight;
      setMenuH(h);
      if (top + h > window.innerHeight - 8) setFlipped(true);
    }
  }, [top]);

  useEffect(() => {
    const h = () => closeRef.current();
    window.addEventListener('click', h, { once: true });
    return () => window.removeEventListener('click', h);
  }, []);

  const buttonTop = triggerTop ?? top - 36;
  const style = flipped
    ? { top: buttonTop - menuH - 4, right }
    : { top, right };

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] bg-bg-elev border border-line rounded-[7px] shadow-[var(--shadow)] min-w-[160px] p-1"
      style={style}
      onClick={e => { e.stopPropagation(); onClose(); }}
    >
      {children}
    </div>,
    document.body
  );
}

export function RowMenuSep() {
  return <div className="h-px bg-line my-1" />;
}

export function RowMenuItem({ icon, onClick, children }: { icon?: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left"
      onClick={onClick}
    >
      {icon}{children}
    </button>
  );
}

export function RowMenuDangerItem({ icon, onClick, children }: { icon?: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left"
      onClick={onClick}
    >
      {icon}{children}
    </button>
  );
}
