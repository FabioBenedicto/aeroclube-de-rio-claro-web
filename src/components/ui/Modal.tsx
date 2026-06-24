import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  maxWidth?: number;
}

function ModalHeader({ title, onClose, children }: { title: string; onClose: () => void; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-line gap-3">
      <span className="font-semibold text-[15px] text-ink">{title}</span>
      {children}
      <button
        className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:bg-bg-hover hover:text-ink cursor-pointer bg-transparent border-0"
        onClick={onClose}
        aria-label="Fechar"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

function ModalFooter({ children, justify = 'end' }: { children: ReactNode; justify?: 'end' | 'between' }) {
  return (
    <div className={`flex items-center gap-2 px-5 py-3.5 border-t border-line${justify === 'between' ? ' justify-between' : ' justify-end'}`}>
      {children}
    </div>
  );
}

function Modal({ children, onClose, maxWidth = 480 }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-bg-elev border border-line rounded-[10px] w-full shadow-[var(--shadow)] flex flex-col max-h-[90vh]"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
