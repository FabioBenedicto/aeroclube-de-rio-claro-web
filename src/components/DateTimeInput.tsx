import { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../utils/cn';

interface DateTimeInputProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

function toDisplay(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}

function toValue(display: string): string {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!m) return '';
  return `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}`;
}

export default function DateTimeInput({ value, onChange, className }: DateTimeInputProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    const formatted = toDisplay(value);
    if (formatted !== display) setDisplay(formatted);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    let fmt = digits;
    if (digits.length > 2)  fmt = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length > 4)  fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    if (digits.length > 8)  fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8)}`;
    if (digits.length > 10) fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8, 10)}:${digits.slice(10)}`;
    setDisplay(fmt);
    const v = toValue(fmt);
    if (v) onChange(v);
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
        placeholder="DD/MM/AAAA HH:MM"
        className={cn(
          'w-full px-2.5 py-[7px] pr-8 border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]',
          className,
        )}
        value={display}
        onChange={handleText}
        maxLength={16}
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
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
        tabIndex={-1}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />
    </div>
  );
}
