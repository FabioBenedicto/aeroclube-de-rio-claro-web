import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Company } from '../../types';
import { maskCNPJ, maskPhone, validateCNPJ } from '../../utils/masks';

export function CompanyModal({ company, onClose, onSave }: {
  company?: Company;
  onClose: () => void;
  onSave: (d: unknown) => void;
}) {
  const [form, setForm] = useState({
    name: company?.name ?? '',
    cnpj: company?.cnpj ?? '',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
  });
  const cnpjFilled = form.cnpj.replace(/\D/g, '').length === 14;
  const cnpjValid = !cnpjFilled || validateCNPJ(form.cnpj);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3">
          <h3 className="text-[15px] font-semibold m-0">{company ? 'Editar empresa' : 'Nova empresa'}</h3>
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Razão social / Nome</label>
            <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">CNPJ</label>
            <input className={`w-full px-2.5 py-[7px] border rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:shadow-[0_0_0_3px_var(--focus)] ${cnpjFilled && !cnpjValid ? 'border-danger focus:border-danger' : 'border-line focus:border-accent'}`} value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: maskCNPJ(e.target.value) }))} />
            {cnpjFilled && !cnpjValid && <span className="text-[11px] text-danger">CNPJ inválido</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">E-mail</label>
            <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Telefone</label>
            <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>Cancelar</button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60" disabled={!form.name.trim() || (cnpjFilled && !cnpjValid)} onClick={() => onSave({ name: form.name, cnpj: form.cnpj || undefined, email: form.email || undefined, phone: form.phone || undefined })}>
            <Check size={14} /> {company ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
