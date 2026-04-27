import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Flight, Customer, Plane } from '../../types';

const FLIGHT_TYPES = ['Instrução', 'Solo', 'Traslado', 'Navegação'];

interface Props {
  mode: 'new' | 'edit';
  flight?: Flight;
  customers: Customer[];
  planes: Plane[];
  onClose: () => void;
  onSave: (data: unknown) => void;
}

export default function FlightModal({ mode, flight, customers, planes, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    plane_id: flight?.plane_id?.toString() ?? '',
    customer_id: flight?.customer_id?.toString() ?? '',
    instructor_id: flight?.instructor_id?.toString() ?? '',
    type: flight?.type ?? 'Instrução',
    double_command: flight?.double_command ?? false,
    origin: flight?.origin ?? '',
    destination: flight?.destination ?? '',
    start_date: flight?.start_date?.slice(0, 16) ?? '',
    end_date: flight?.end_date?.slice(0, 16) ?? '',
  });

  const instructors = customers.filter(c => c.categories.includes('instrutor'));

  function handleSave() {
    onSave({
      plane_id: Number(form.plane_id),
      customer_id: Number(form.customer_id),
      instructor_id: form.instructor_id ? Number(form.instructor_id) : undefined,
      type: form.type,
      double_command: form.double_command,
      origin: form.origin,
      destination: form.destination,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined,
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-head">
          <h3 className="modal-title">{mode === 'new' ? 'Registrar voo' : 'Editar voo'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body stack">
          <div className="g2">
            <div className="field">
              <label>Aeronave</label>
              <select className="select" value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
                <option value="">— Selecione —</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.registration} {p.model ? `· ${p.model}` : ''}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tipo de voo</label>
              <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {FLIGHT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="g2">
            <div className="field">
              <label>Cliente</label>
              <select className="select" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">— Selecione —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Instrutor (opcional)</label>
              <select className="select" value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}>
                <option value="">— Nenhum —</option>
                {instructors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="g2">
            <div className="field">
              <label>Origem (ICAO)</label>
              <input className="input mono" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))} placeholder="SDRK" />
            </div>
            <div className="field">
              <label>Destino (ICAO)</label>
              <input className="input mono" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} placeholder="SDRK" />
            </div>
          </div>
          <div className="g2">
            <div className="field">
              <label>Início</label>
              <input className="input mono" type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="field">
              <label>Fim (opcional)</label>
              <input className="input mono" type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.double_command} onChange={e => setForm(f => ({ ...f, double_command: e.target.checked }))} />
            <span style={{ fontSize: 13 }}>Duplo comando (gera título a pagar para instrutor)</span>
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={handleSave}><Check size={14} /> {mode === 'new' ? 'Registrar' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );
}
