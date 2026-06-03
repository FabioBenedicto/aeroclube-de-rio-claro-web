import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { maskCPF, maskPhone, validateCPF } from '../../utils/masks';
import type { Person } from '../../types';

interface Props {
  mode: 'new' | 'edit';
  person?: Person;
  onClose: () => void;
  onSave: (data: unknown, id?: number) => void;
}

const CATEGORIES = ['student', 'partner', 'instructor', 'employee'] as const;
const CAT_LABEL: Record<string, string> = { student: 'Aluno', partner: 'Sócio', instructor: 'Instrutor', employee: 'Funcionário' };
const STEPS = ['Tipo', 'Informações', 'Endereço'] as const;

const inp = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

export default function PersonModal({ mode, person, onClose, onSave }: Props) {
  const isNew = mode === 'new';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cepLoading, setCepLoading] = useState(false);
  const [form, setForm] = useState({
    name: person?.name ?? '',
    cpf: person?.cpf ?? '',
    email: person?.email ?? '',
    phone_number: person?.phone_number ?? '',
    address: person?.address ?? '',
    neighborhood: person?.neighborhood ?? '',
    city: person?.city ?? '',
    state: person?.state ?? '',
    zip_code: person?.zip_code ?? '',
    categories: person?.categories ?? [] as string[],
  });

  async function handleCepChange(raw: string) {
    const cep = raw.replace(/\D/g, '').slice(0, 8);
    setForm(f => ({ ...f, zip_code: cep }));
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          address: data.logradouro || f.address,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch {
      // silently ignore lookup failures
    } finally {
      setCepLoading(false);
    }
  }

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
    if (categories.includes('student')) data.student = {};
    if (categories.includes('partner')) data.partner = { monthly_dues: 0 };
    if (categories.includes('instructor')) data.instructor = {};
    if (categories.includes('employee')) data.employee = {};
    onSave(data, person?.id);
  }

  const cpfFilled = form.cpf.replace(/\D/g, '').length === 11;
  const cpfValid = !cpfFilled || validateCPF(form.cpf);

  const step1Valid = form.categories.length > 0;
  const step2Valid = form.name.trim() !== '' && cpfFilled && cpfValid && form.email.trim() !== '';
  const step3Valid = form.address.trim() !== '';
  const currentStepValid = [step1Valid, step2Valid, step3Valid][step - 1];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0 shrink-0">{isNew ? 'Nova pessoa' : 'Editar pessoa'}</h3>
            <div className="flex items-center gap-1.5">
              {STEPS.map((label, i) => {
                const n = (i + 1) as 1 | 2 | 3;
                return (
                  <span key={n} className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${step === n ? 'bg-accent text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                    <span className="text-[11px] text-ink-3">{label}</span>
                    {i < STEPS.length - 1 && <ChevronRight size={12} className="text-ink-3" />}
                  </span>
                );
              })}
            </div>
          </div>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step 1 — Tipo */}
        {step === 1 && (
          <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-3">
            <p className="text-[13px] text-ink-3 m-0">Selecione o(s) tipo(s) desta pessoa. Pode ser mais de um.</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={cn(
                    'flex items-center justify-center px-3 py-3 rounded-lg text-[13px] font-medium border cursor-pointer transition-[background,border-color] duration-[80ms]',
                    form.categories.includes(cat)
                      ? 'bg-accent border-accent text-white hover:opacity-90'
                      : 'bg-bg-elev border-line text-ink-2 hover:bg-bg-hover hover:text-ink'
                  )}
                  onClick={() => toggleCat(cat)}
                >
                  {CAT_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Informações */}
        {step === 2 && (
          <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Nome completo</label>
                <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">CPF</label>
                <input className={`${inp} font-mono ${cpfFilled && !cpfValid ? 'border-danger focus:border-danger' : ''}`} value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} />
                {cpfFilled && !cpfValid && <span className="text-[11px] text-danger">CPF inválido</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">E-mail</label>
                <input className={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Telefone <span className="text-ink-3 font-normal">(opcional)</span></label>
                <input className={inp} value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: maskPhone(e.target.value) }))} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Endereço */}
        {step === 3 && (
          <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Logradouro</label>
              <input className={inp} placeholder="Rua Exemplo, 123, Apto 10" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Bairro</label>
                <input className={inp} value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">CEP</label>
                <div className="relative">
                  <input className={`${inp} font-mono pr-7`} placeholder="13500300" maxLength={8} value={form.zip_code} onChange={e => handleCepChange(e.target.value)} />
                  {cepLoading && <Loader2 size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 animate-spin" />}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Cidade</label>
                <input className={inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">UF</label>
                <input className={`${inp} font-mono`} maxLength={2} placeholder="SP" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) }))} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line">
          <button className={btnCancel} onClick={step === 1 ? onClose : () => setStep(s => (s - 1) as 1 | 2 | 3)}>
            {step === 1 ? 'Cancelar' : <><ChevronLeft size={14} /> Voltar</>}
          </button>
          {step < 3 ? (
            <button className={btnPrimary} disabled={!currentStepValid} onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}>
              Próximo <ChevronRight size={14} />
            </button>
          ) : (
            <button className={btnPrimary} disabled={!step3Valid} onClick={handleSubmit}>
              <Check size={14} /> {isNew ? 'Cadastrar pessoa' : 'Salvar alterações'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
