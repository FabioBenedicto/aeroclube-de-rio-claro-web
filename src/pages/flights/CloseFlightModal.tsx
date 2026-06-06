import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Flight } from '../../types';
import { formatDate } from '../../utils/format';
import DateTimeInput from '../../components/DateTimeInput';
import Button from '../../components/ui/Button';

interface Props { flight: Flight; onClose: () => void; onSave: (end_date: string) => void; }

function nowLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CloseFlightModal({ flight, onClose, onSave }: Props) {
  const [endDatetime, setEndDatetime] = useState(nowLocal);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold m-0">Encerrar voo</h3>
            <div className="text-[11.5px] text-ink-3 mt-0.5">
              {flight.plane?.registration} · {flight.origin} → {flight.destination} · Início {formatDate(flight.start_date)}
            </div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Data/hora de encerramento</label>
            <DateTimeInput value={endDatetime} onChange={setEndDatetime} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave(new Date(endDatetime).toISOString())}>
            <Check size={14} /> Encerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
