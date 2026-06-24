import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Option {
  id: number;
  name: string;
}

interface ComboboxProps {
  value: string;
  onChange: (id: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function Combobox({ value, onChange, options, placeholder = 'Selecione...', className }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => String(o.id) === value);

  const filtered = query
    ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleOpen() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(opt: Option) {
    onChange(String(opt.id));
    setOpen(false);
    setQuery('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setOpen(false);
    setQuery('');
  }

  const dropdown = open && createPortal(
    <div
      style={dropdownStyle}
      className="bg-bg-elev border border-line rounded-md shadow-[var(--shadow)] max-h-[220px] overflow-y-auto"
    >
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-[12px] text-ink-4">Nenhum resultado</div>
      ) : (
        filtered.map(opt => (
          <div
            key={opt.id}
            className={cn(
              'px-3 py-2 text-[13px] cursor-pointer hover:bg-bg-hover transition-colors',
              String(opt.id) === value ? 'text-accent font-medium bg-accent-soft' : 'text-ink',
            )}
            onMouseDown={e => { e.preventDefault(); handleSelect(opt); }}
          >
            {opt.name}
          </div>
        ))
      )}
    </div>,
    document.body,
  );

  return (
    <div ref={triggerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] cursor-pointer gap-1.5',
          'hover:border-ink-4 transition-colors',
          open && 'border-accent shadow-[0_0_0_3px_var(--focus)]',
        )}
        onClick={handleOpen}
      >
        {open ? (
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-4"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar..."
          />
        ) : (
          <span className={cn('flex-1 truncate', selected ? 'text-ink' : 'text-ink-4')}>
            {selected ? selected.name : placeholder}
          </span>
        )}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {value && !open && (
            <button
              className="p-0.5 rounded hover:bg-bg-hover text-ink-3 hover:text-ink transition-colors"
              onClick={handleClear}
              tabIndex={-1}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={14} className={cn('text-ink-3 transition-transform', open && 'rotate-180')} />
        </div>
      </div>

      {dropdown}
    </div>
  );
}
