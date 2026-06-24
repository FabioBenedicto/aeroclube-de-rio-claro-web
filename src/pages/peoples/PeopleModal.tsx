import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { maskCEP, maskCPF, maskPhone, validateCPF } from '../../utils/masks';
import type { People, PeopleCategory } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

interface Props {
  mode: 'new' | 'edit';
  people?: People;
  onClose: () => void;
  onSave: (data: unknown, id?: number) => void;
}

const CATEGORIES = ['student', 'partner', 'instructor', 'employee'] as const;
const CAT_LABEL: Record<PeopleCategory, string> = { student: 'Aluno', partner: 'Sócio', instructor: 'Instrutor', employee: 'Funcionário' };
const STEPS = ['Tipo', 'Informações', 'Endereço'] as const;

export default function PeopleModal({ mode, people, onClose, onSave }: Props) {
  const isNew = mode === 'new';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cepLoading, setCepLoading] = useState(false);
  const [form, setForm] = useState({
    name: people?.name ?? '',
    cpf: people?.cpf ?? '',
    email: people?.email ?? '',
    phone_number: people?.phone_number ?? '',
    street: people?.address?.street ?? '',
    neighborhood: people?.address?.neighborhood ?? '',
    city: people?.address?.city ?? '',
    state: people?.address?.state ?? '',
    zip_code: people?.address?.zip_code ?? '',
    categories: people?.categories ?? [] as PeopleCategory[],
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
          street: data.logradouro || f.street,
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

  function toggleCat(cat: PeopleCategory) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  }

  function handleSubmit() {
    const { categories, street, zip_code, ...rest } = form;
    const data: Record<string, unknown> = {
      ...rest,
      street,
      zip_code: zip_code.replace(/\D/g, ''),
    };
    if (categories.includes('student')) data.student = {};
    if (categories.includes('partner')) data.partner = { monthly_dues: 0 };
    if (categories.includes('instructor')) data.instructor = {};
    if (categories.includes('employee')) data.employee = {};
    onSave(data, people?.id);
  }

  const cpfFilled = form.cpf.replace(/\D/g, '').length === 11;
  const cpfValid = !cpfFilled || validateCPF(form.cpf);

  const step1Valid = form.categories.length > 0;
  const step2Valid = form.name.trim() !== '' && cpfFilled && cpfValid && form.email.trim() !== '';
  const step3Valid = form.zip_code.length === 8 && form.street.trim() !== '';
  const currentStepValid = [step1Valid, step2Valid, step3Valid][step - 1];

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div className="flex items-start justify-between px-5 py-4 border-b border-line gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink shrink-0">{isNew ? 'Nova pessoa' : 'Editar pessoa'}</span>
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
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:bg-bg-hover hover:text-ink cursor-pointer bg-transparent border-0"
          onClick={onClose}
          aria-label="Fechar"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {step === 1 && (
        <Modal.Body>
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
        </Modal.Body>
      )}

      {step === 2 && (
        <Modal.Body>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Nome completo</label>
              <Input placeholder="Nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">CPF</label>
              <Input className={`font-mono ${cpfFilled && !cpfValid ? 'border-danger focus:border-danger' : ''}`} placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} />
              {cpfFilled && !cpfValid && <span className="text-[11px] text-danger">CPF inválido</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">E-mail</label>
              <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Telefone <span className="text-ink-3 font-normal">(opcional)</span></label>
              <Input placeholder="(00) 00000-0000" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: maskPhone(e.target.value) }))} />
            </div>
          </div>
        </Modal.Body>
      )}

      {step === 3 && (
        <Modal.Body>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-ink-2">CEP <span className="text-danger">*</span></label>
            <div className="relative">
              <Input
                className="font-mono pr-8"
                placeholder="00000-000"
                maxLength={9}
                value={maskCEP(form.zip_code)}
                onChange={e => handleCepChange(e.target.value)}
                autoFocus
              />
              {cepLoading && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 animate-spin" />}
            </div>
            <p className="text-[11px] text-ink-3 m-0">Digite o CEP para preencher o endereço automaticamente.</p>
          </div>

          {(() => {
            const locked = form.zip_code.length < 8;
            return (
              <div className={locked ? 'opacity-40 pointer-events-none select-none' : undefined}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Logradouro <span className="text-danger">*</span></label>
                    <Input placeholder="Rua Exemplo, 123, Apto 10" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} disabled={locked} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-ink-2">Bairro</label>
                      <Input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} disabled={locked} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-ink-2">Cidade</label>
                      <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} disabled={locked} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5" style={{ maxWidth: 80 }}>
                    <label className="text-[12px] font-medium text-ink-2">UF</label>
                    <Input className="font-mono" maxLength={2} placeholder="SP" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) }))} disabled={locked} />
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal.Body>
      )}

      <Modal.Footer justify="end">
        <Button variant="default" onClick={step === 1 ? onClose : () => setStep(s => (s - 1) as 1 | 2 | 3)}>
          {step === 1 ? 'Cancelar' : <><ChevronLeft size={14} /> Voltar</>}
        </Button>
        {step < 3 ? (
          <Button variant="primary" disabled={!currentStepValid} onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}>
            Próximo <ChevronRight size={14} />
          </Button>
        ) : (
          <Button variant="primary" disabled={!step3Valid} onClick={handleSubmit}>
            <Check size={14} /> {isNew ? 'Cadastrar pessoa' : 'Salvar alterações'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
