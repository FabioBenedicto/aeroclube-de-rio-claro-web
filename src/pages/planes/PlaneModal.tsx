import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Plane } from '../../types';

interface Props { mode: 'new' | 'edit'; plane?: Plane; onClose: () => void; onSave: (data: unknown, id?: number) => void; }

export default function PlaneModal({ mode, plane, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    registration: plane?.registration ?? '',
    model: plane?.model ?? '',
    flight_hour_value: plane?.flight_hour_value?.toString() ?? '',
    status: plane?.status ?? 'active',
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{mode === 'new' ? 'Nova aeronave' : 'Editar aeronave'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body stack">
          <div className="g2">
            <div className="field">
              <label>Matrícula</label>
              <input className="input mono" value={form.registration} onChange={e => setForm(f => ({ ...f, registration: e.target.value.toUpperCase() }))} placeholder="PT-RCL" />
            </div>
            <div className="field">
              <label>Modelo</label>
              <input className="input" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Cessna 172" />
            </div>
          </div>
          <div className="g2">
            <div className="field">
              <label>Valor/hora (R$)</label>
              <div className="input-group">
                <span className="prefix">R$</span>
                <input className="input mono" type="number" step="0.01" value={form.flight_hour_value} onChange={e => setForm(f => ({ ...f, flight_hour_value: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Disponível</option>
                <option value="in-flight">Em voo</option>
                <option value="maintenance">Manutenção</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={() => onSave({ ...form, flight_hour_value: parseFloat(form.flight_hour_value) }, plane?.id)}>
            <Check size={14} /> {mode === 'new' ? 'Cadastrar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
