import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Paperclip, ExternalLink, X, Trash2 } from 'lucide-react';

interface Props {
  nfPath?: string | null;
  showNf?: boolean;
  uploadsBase?: string;
  onAddNf: (file: File) => void;
  onRemoveNf: () => void;
  onDelete: () => void;
  uploadPending?: boolean;
  nfDeletePending?: boolean;
}

const item = 'flex items-center gap-2 px-3 py-[7px] text-[13px] text-ink hover:bg-bg-hover cursor-pointer w-full text-left border-0 bg-transparent disabled:opacity-40';
const dangerItem = 'flex items-center gap-2 px-3 py-[7px] text-[13px] text-danger hover:bg-bg-hover cursor-pointer w-full text-left border-0 bg-transparent disabled:opacity-40';

export default function PaymentRowMenu({
  nfPath, showNf = true, uploadsBase = 'http://localhost:3001',
  onAddNf, onRemoveNf, onDelete,
  uploadPending, nfDeletePending,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.right - 180 });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-bg-elev border border-line rounded-lg shadow-lg py-1 min-w-[180px]"
    >
      {showNf && (
        <>
          {nfPath ? (
            <>
              <a
                href={nfPath.startsWith('http') ? nfPath : `${uploadsBase}${nfPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${item} no-underline`}
                onClick={() => setOpen(false)}
              >
                <ExternalLink size={13} className="text-ink-3 shrink-0" />
                Ver nota fiscal
              </a>
              <button
                className={item}
                disabled={nfDeletePending}
                onClick={() => { onRemoveNf(); setOpen(false); }}
              >
                <X size={13} className="text-ink-3 shrink-0" />
                Remover nota fiscal
              </button>
            </>
          ) : (
            <button
              className={item}
              disabled={uploadPending}
              onClick={() => { fileRef.current?.click(); setOpen(false); }}
            >
              <Paperclip size={13} className="text-ink-3 shrink-0" />
              Adicionar nota fiscal
            </button>
          )}
          <div className="border-t border-line my-1" />
        </>
      )}
      <button
        className={dangerItem}
        onClick={() => { onDelete(); setOpen(false); }}
      >
        <Trash2 size={13} className="shrink-0" />
        Excluir
      </button>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
        onClick={openMenu}
      >
        <MoreHorizontal size={15} />
      </button>

      {menu}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onAddNf(f);
          e.target.value = '';
        }}
      />
    </>
  );
}
