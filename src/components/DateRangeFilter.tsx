import { useState } from 'react';
import DateInput from './DateInput';
import Button from './ui/Button';

interface DateRangeFilterProps {
  label: string;
  onApply: (from: string, to: string) => void;
}

export default function DateRangeFilter({ label, onApply }: DateRangeFilterProps) {
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');

  return (
    <div className="flex items-center gap-3 justify-end">
      <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
        <DateInput value={pendingFrom} onChange={setPendingFrom} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Até</span>
        <DateInput value={pendingTo} onChange={setPendingTo} />
      </div>
      <Button variant="primary" onClick={() => onApply(pendingFrom, pendingTo)}>Aplicar</Button>
    </div>
  );
}
