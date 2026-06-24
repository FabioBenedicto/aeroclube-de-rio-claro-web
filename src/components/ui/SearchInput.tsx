interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minWidth?: number;
}

export default function SearchInput({ value, onChange, placeholder, minWidth = 220 }: SearchInputProps) {
  return (
    <div className="relative flex items-center">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
        style={{ minWidth }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
