import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Flight } from '../../types';
import { formatDate } from '../../utils/format';

interface Props { flight: Flight; onClose: () => void; onSave: (end_date: string) => void; }

export default function CloseFlightModal({ flight, onClose, onSave }: Props) {
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 16));
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Encerrar voo</h3>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
              {flight.plane?.registration} · {flight.origin} → {flight.destination} · Início {formatDate(flight.start_date)}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Data/hora de encerramento</label>
            <input className="input mono" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={() => onSave(new Date(endDate).toISOString())}><Check size={14} /> Encerrar</button>
        </div>
      </div>
    </div>
  );
}
