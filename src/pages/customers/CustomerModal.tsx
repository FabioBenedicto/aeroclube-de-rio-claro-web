import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { maskCPF, maskPhone } from '../../utils/masks';
import type { Customer } from '../../types';

interface Props {
  mode: 'new' | 'edit';
  customer?: Customer;
  onClose: () => void;
  onSave: (data: unknown, id?: number) => void;
}

const CATEGORIES = ['aluno', 'socio', 'instrutor', 'funcionario'] as const;

export default function CustomerModal({ mode, customer, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    cpf: customer?.cpf ?? '',
    email: customer?.email ?? '',
    phone_number: customer?.phone_number ?? '',
    address: customer?.address ?? '',
    neighborhood: customer?.neighborhood ?? '',
    city: customer?.city ?? '',
    state: customer?.state ?? '',
    zip_code: customer?.zip_code ?? '',
    categories: customer?.categories ?? [] as string[],
  });

  const [showAddress, setShowAddress] = useState(
    mode === 'edit' && !!(customer?.address),
  );

  function toggleCat(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  }

  function handleSubmit() {
    const { categories, ...rest } = form;
    const data: Record<string, unknown> = { ...rest };
    if (categories.includes('aluno')) data.student = {};
    if (categories.includes('socio')) data.partner = { monthly_dues: 0 };
    if (categories.includes('instrutor')) data.instructor = {};
    if (categories.includes('funcionario')) data.employee = {};
    onSave(data, customer?.id);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3">
          <div>
            <h3 className="text-[15px] font-semibold m-0">{mode === 'new' ? 'Nova pessoa' : 'Editar pessoa'}</h3>
            {customer && <div className="text-[11.5px] text-ink-3 font-mono mt-0.5">{customer.cpf} · {customer.name}</div>}
          </div>
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Nome completo</label>
              <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">CPF</label>
              <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">E-mail</label>
              <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Telefone</label>
              <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: maskPhone(e.target.value) }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="flex items-center gap-2 text-[12px] font-medium text-ink-2 hover:text-ink text-left"
              onClick={() => setShowAddress(v => !v)}
            >
              <span className="text-ink-4">{showAddress ? '▾' : '▸'}</span>
              Endereço{' '}
              {form.address
                ? <span className="text-accent text-[11px]">✓ preenchido</span>
                : <span className="text-ink-4 text-[11px]">(opcional)</span>}
            </button>
            {showAddress && (
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-line">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Logradouro</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    placeholder="Rua Exemplo, 123, Apto 10"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Bairro</label>
                    <input
                      className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      value={form.neighborhood}
                      onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">CEP</label>
                    <input
                      className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      placeholder="13500300"
                      maxLength={8}
                      value={form.zip_code}
                      onChange={e => setForm(f => ({ ...f, zip_code: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Cidade</label>
                    <input
                      className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">UF</label>
                    <input
                      className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      maxLength={2}
                      placeholder="SP"
                      value={form.state}
                      onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Categorias</label>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border cursor-pointer transition-[background,border-color] duration-[80ms]',
                    form.categories.includes(cat)
                      ? 'bg-accent border-accent text-white hover:opacity-90'
                      : 'bg-bg-elev border-line text-ink-2 hover:bg-bg-hover hover:text-ink'
                  )}
                  onClick={() => toggleCat(cat)}
                >
                  {{ aluno: 'Aluno', socio: 'Sócio', instrutor: 'Instrutor', funcionario: 'Funcionário' }[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>Cancelar</button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={handleSubmit}>
            <Check size={14} /> {mode === 'new' ? 'Cadastrar pessoa' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
