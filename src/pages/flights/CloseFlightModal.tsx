import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Flight } from '../../types';
import { formatDate } from '../../utils/format';
import DateTimeInput from '../../components/DateTimeInput';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

interface Props { flight: Flight; onClose: () => void; onSave: (end_date: string) => void; }

function nowLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CloseFlightModal({ flight, onClose, onSave }: Props) {
  const [endDatetime, setEndDatetime] = useState(nowLocal);

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-line gap-3 flex-shrink-0">
        <div>
          <span className="text-[15px] font-semibold text-ink">Encerrar voo</span>
          <div className="text-[11.5px] text-ink-3 mt-0.5">
            {flight.aircraft?.registration} · {flight.origin} → {flight.destination} · Início {formatDate(flight.start_date)}
          </div>
        </div>
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:bg-bg-hover hover:text-ink cursor-pointer bg-transparent border-0"
          onClick={onClose}
          aria-label="Fechar"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <Modal.Body>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-ink-2">Data/hora de encerramento</label>
          <DateTimeInput value={endDatetime} onChange={setEndDatetime} />
        </div>
      </Modal.Body>
      <Modal.Footer justify="end">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(new Date(endDatetime).toISOString())}>
          <Check size={14} /> Encerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
