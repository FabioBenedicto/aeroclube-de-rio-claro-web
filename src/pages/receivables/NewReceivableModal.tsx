import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check as CheckIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import DateInput from '../../components/DateInput';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import type { Plane, Company } from '../../types';
import { getReceivableTypes } from '../../api/receivable-types';
import { toast } from '../../utils/toast';
import Button from '../../components/ui/Button';
import Combobox from '../../components/ui/Combobox';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import { PAYER_TYPES } from '../../utils/payerTypes';

type NamedOption = { id: number; name: string };

export function NewReceivableModal({ customers, students, instructors, partners, employees, planes, companies, initialPlaneId, onClose, onSave }: {
  customers: NamedOption[];
  students: NamedOption[];
  instructors: NamedOption[];
  partners: NamedOption[];
  employees: NamedOption[];
  planes: Plane[];
  companies: Company[];
  initialPlaneId?: number;
  onClose: () => void;
  onSave: (d: unknown) => void;
}) {
  const totalSteps = initialPlaneId ? 5 : 6;
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [form, setForm] = useState({
    payer_type: '', payer_id: '', plane_id: '',
    title: '', description: '', receivable_type_id: '',
    expiration_date: '', total_amount: '',
    recurrence: '', occurrences: '2',
  });

  const { data: receivableTypes = [] } = useQuery({ queryKey: ['receivable-types'], queryFn: getReceivableTypes });

  const payerLists: Record<string, NamedOption[]> = { customer: customers, student: students, company: companies, instructor: instructors, partner: partners, employee: employees };
  const payerList = payerLists[form.payer_type] ?? [];

  function goNext() {
    if (step === 1 && !form.receivable_type_id) { toast.error('Selecione o tipo de título'); return; }
    if (step === 2 && !form.payer_type) { toast.error('Selecione o tipo de pagador'); return; }
    if (step === 3 && !form.payer_id) { toast.error('Selecione o pagador'); return; }
    if (step === 4 && !form.title.trim()) { toast.error('Título é obrigatório'); return; }
    setStep(s => (s + 1) as 1 | 2 | 3 | 4 | 5 | 6);
  }

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div className="flex items-start justify-between px-5 py-4 border-b border-line gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink">Novo título a receber</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n, i) => (
              <span key={n} className="flex items-center gap-1">
                <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${step === n ? 'bg-accent text-white' : step > n ? 'bg-success text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                {i < totalSteps - 1 && <ChevronRight size={10} className="text-ink-4" />}
              </span>
            ))}
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
        {step === 1 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Tipo de título</label>
            <Combobox
              value={form.receivable_type_id}
              onChange={id => setForm(f => ({ ...f, receivable_type_id: id }))}
              options={receivableTypes}
              placeholder="Selecione o tipo"
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-3 gap-2.5">
            {PAYER_TYPES.map(({ value, label, Icon }) => {
              const active = form.payer_type === value;
              return (
                <button
                  key={value}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-lg border-2 cursor-pointer transition-colors ${active ? 'border-accent bg-accent-soft' : 'border-line bg-bg hover:bg-bg-hover'}`}
                  onClick={() => setForm(f => ({ ...f, payer_type: value, payer_id: '' }))}
                >
                  <Icon size={22} className={active ? 'text-accent' : 'text-ink-3'} />
                  <span className={`text-[12px] font-medium ${active ? 'text-accent-ink' : 'text-ink-2'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Selecionar pagador</label>
            <Select value={form.payer_id} onChange={e => setForm(f => ({ ...f, payer_id: e.target.value }))}>
              <option value="">Selecione</option>
              {payerList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-col gap-1.5"><label className="text-[12px] font-medium text-ink-2">Título</label>
              <Input placeholder="Ex: Mensalidade" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5"><label className="text-[12px] font-medium text-ink-2">Descrição</label>
              <Textarea className="min-h-[60px]" rows={2} placeholder="Descrição opcional" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-[12px] font-medium text-ink-2">Vencimento</label>
                <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
              </div>
              <div className="flex flex-col gap-1.5"><label className="text-[12px] font-medium text-ink-2">Valor</label>
                <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                  <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                  <input inputMode="numeric" placeholder="0,00" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: maskCurrency(e.target.value) }))} />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 5 && !initialPlaneId && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Aeronave</label>
            <Select value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
              <option value="">Sem aeronave</option>
              {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''}</option>)}
            </Select>
          </div>
        )}

        {((step === 6 && !initialPlaneId) || (step === 5 && !!initialPlaneId)) && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-[12px] font-medium text-ink-2">Repetir</label>
                <Select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                  <option value="">Sem recorrência</option>
                  <option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="yearly">Anual</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><label className="text-[12px] font-medium text-ink-2">Nº de ocorrências</label>
                <Input type="number" className="font-mono" min={2} max={60} value={form.occurrences} onChange={e => setForm(f => ({ ...f, occurrences: e.target.value }))} disabled={!form.recurrence} />
              </div>
            </div>
            {form.recurrence && (
              <div className="text-[12px] text-ink-3">
                Serão criados <strong>{form.occurrences}</strong> títulos com vencimentos {form.recurrence === 'monthly' ? 'mensais' : form.recurrence === 'weekly' ? 'semanais' : 'anuais'}, a partir da data informada.
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer justify="between">
        <div>
          {step > 1 && <Button variant="default" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3 | 4 | 5 | 6)}><ChevronLeft size={14} /> Voltar</Button>}
        </div>
        <div className="flex items-center gap-2">
          {step === 1 && <Button variant="default" onClick={onClose}>Cancelar</Button>}
          {step < totalSteps
            ? <Button variant="primary" onClick={goNext}>Próximo <ChevronRight size={14} /></Button>
            : <Button variant="primary" onClick={() => onSave({
              stakeholder: { customer: 'PEOPLE', student: 'STUDENT', instructor: 'INSTRUCTOR', partner: 'PARTNER', employee: 'EMPLOYEE', company: 'COMPANY' }[form.payer_type] ?? 'NONE',
              ...(form.payer_type === 'customer' && form.payer_id && { person_id: Number(form.payer_id) }),
              ...(form.payer_type === 'student' && form.payer_id && { student_id: Number(form.payer_id) }),
              ...(form.payer_type === 'company' && form.payer_id && { company_id: Number(form.payer_id) }),
              ...(form.payer_type === 'instructor' && form.payer_id && { instructor_id: Number(form.payer_id) }),
              ...(form.payer_type === 'partner' && form.payer_id && { partner_id: Number(form.payer_id) }),
              ...(form.payer_type === 'employee' && form.payer_id && { employee_id: Number(form.payer_id) }),
              plane_id: initialPlaneId ?? (form.plane_id ? Number(form.plane_id) : undefined),
              title: form.title,
              description: form.description || undefined,
              receivable_type_id: form.receivable_type_id ? Number(form.receivable_type_id) : undefined,
              expiration_date: form.expiration_date || undefined,
              total_amount: parseCurrency(form.total_amount),
              recurrence: form.recurrence || undefined,
              occurrences: form.recurrence ? Number(form.occurrences) : undefined,
            })}>
              <CheckIcon size={14} /> Criar título
            </Button>}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
