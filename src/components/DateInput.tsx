import { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../utils/cn';

interface DateInputProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

function toDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function toIso(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

export default function DateInput({ value, onChange, className }: DateInputProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    const formatted = toDisplay(value);
    if (formatted !== display) setDisplay(formatted);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let fmt = digits;
    if (digits.length > 2) fmt = digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length > 4) fmt = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    setDisplay(fmt);
    const iso = toIso(fmt);
    if (iso) onChange(iso);
    else if (fmt === '') onChange('');
  };

  const openPicker = () => {
    const el = nativeRef.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.click(); }
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        className={cn(
          'w-full px-2.5 py-[7px] pr-8 border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]',
          className,
        )}
        value={display}
        onChange={handleText}
        maxLength={10}
      />
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-0 p-0 cursor-pointer text-ink-3 flex items-center"
      >
        <Calendar size={13} />
      </button>
      <input
        ref={nativeRef}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        tabIndex={-1}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />
    </div>
  );
}
