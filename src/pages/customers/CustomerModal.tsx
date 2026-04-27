import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Customer } from '../../types';

interface Props {
  mode: 'new' | 'edit';
  customer?: Customer;
  onClose: () => void;
  onSave: (data: unknown, id?: number) => void;
}

const CATEGORIES = ['aluno', 'socio', 'instrutor'] as const;

export default function CustomerModal({ mode, customer, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    cpf: customer?.cpf ?? '',
    email: customer?.email ?? '',
    phone_number: customer?.phone_number ?? '',
    categories: customer?.categories ?? [] as string[],
  });

  function toggleCat(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat],
    }));
  }

  function handleSubmit() {
    const { categories, ...rest } = form;
    const data: Record<string, unknown> = { ...rest };
    if (categories.includes('aluno')) data.student = {};
    if (categories.includes('socio')) data.partner = { monthly_dues: 0 };
    if (categories.includes('instrutor')) data.instructor = { canac: '' };
    onSave(data, customer?.id);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">{mode === 'new' ? 'Novo cliente' : 'Editar cliente'}</h3>
            {customer && <div className="card-sub mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{customer.cpf} · {customer.name}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body stack">
          <div className="g2">
            <div className="field">
              <label>Nome completo</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>CPF</label>
              <input className="input mono" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
          </div>
          <div className="g2">
            <div className="field">
              <label>E-mail</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input className="input" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="field">
            <label>Categorias</label>
            <div className="row" style={{ gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`btn ${form.categories.includes(cat) ? 'primary' : ''}`}
                  onClick={() => toggleCat(cat)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {cat === 'socio' ? 'Sócio' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={handleSubmit}><Check size={14} /> {mode === 'new' ? 'Cadastrar' : 'Salvar alterações'}</button>
        </div>
      </div>
    </div>
  );
}
