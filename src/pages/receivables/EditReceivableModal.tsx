import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check as CheckIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import DateInput from '../../components/DateInput';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import type { Receivable, People } from '../../types';
import { getPlanes } from '../../api/planes';
import { getPeoples } from '../../api/peoples';
import { getCompanies } from '../../api/companies';
import { getReceivableTypes } from '../../api/receivable-types';
import Button from '../../components/ui/Button';
import Combobox from '../../components/ui/Combobox';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import { PAYER_TYPES } from '../../utils/payerTypes';

const STAKEHOLDER_TO_PAYER: Record<string, string> = {
  PEOPLE: 'customer', INSTRUCTOR: 'instructor', PARTNER: 'partner',
  EMPLOYEE: 'employee', COMPANY: 'company',
};

function initPayerType(rec: Receivable): string {
  return STAKEHOLDER_TO_PAYER[rec.stakeholder ?? ''] ?? 'customer';
}

function initPayerId(rec: Receivable, payerType: string): string {
  const map: Record<string, number | undefined> = {
    customer: rec.people_id ?? rec.person_id, instructor: rec.instructor_id,
    partner: rec.partner_id, employee: rec.employee_id, company: rec.company_id,
  };
  return map[payerType] ? String(map[payerType]) : '';
}

export function EditReceivableModal({ rec, onClose, onSave }: { rec: Receivable; onClose: () => void; onSave: (d: unknown) => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const initialPayerType = initPayerType(rec);
  const [form, setForm] = useState({
    receivable_type_id: rec.receivable_type_id ? String(rec.receivable_type_id) : '',
    payer_type: initialPayerType,
    payer_id: initPayerId(rec, initialPayerType),
    title: rec.title,
    description: rec.description ?? '',
    expiration_date: rec.expiration_date?.slice(0, 10) ?? '',
    total_amount: maskCurrency(Math.round(Number(rec.total_amount) * 100).toString()),
    plane_id: rec.plane_id ? String(rec.plane_id) : '',
  });

  const { data: receivableTypes = [] } = useQuery({ queryKey: ['receivable-types'], queryFn: getReceivableTypes });
  const { data: planesData } = useQuery({ queryKey: ['planes-all'], queryFn: () => getPlanes(1, 100) });
  const planes = planesData?.data ?? [];

  const { data: customersData } = useQuery({ queryKey: ['peoples-all-edit'], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const customers = (customersData?.data ?? []).map((c: People) => ({ id: c.id, name: c.name }));

  const { data: instructorData } = useQuery({ queryKey: ['peoples-instructor-edit'], queryFn: () => getPeoples(undefined, 'instructor', 1, 9999) });
  const instructors = (instructorData?.data ?? [])
    .filter((c: People) => c.instructors != null)
    .map((c: People) => ({ id: c.instructors!.id, name: c.name }));

  const { data: partnerData } = useQuery({ queryKey: ['peoples-partner-edit'], queryFn: () => getPeoples(undefined, 'partner', 1, 9999) });
  const partners = (partnerData?.data ?? [])
    .filter((c: People) => c.partners != null)
    .map((c: People) => ({ id: c.partners!.id, name: c.name }));

  const { data: employeeData } = useQuery({ queryKey: ['peoples-employee-edit'], queryFn: () => getPeoples(undefined, 'employee', 1, 9999) });
  const employees = (employeeData?.data ?? [])
    .filter((c: People) => c.employees != null)
    .map((c: People) => ({ id: c.employees!.id, name: c.name }));

  const { data: companiesData } = useQuery({ queryKey: ['companies-all-edit'], queryFn: () => getCompanies(undefined, 1, 9999) });
  const companies = (companiesData?.data ?? []).map((c: { id: number; name: string }) => ({ id: c.id, name: c.name }));

  const payerLists: Record<string, { id: number; name: string }[]> = {
    customer: customers, instructor: instructors, partner: partners,
    employee: employees, company: companies,
  };
  const payerList = payerLists[form.payer_type] ?? [];

  function goNext() {
    if (step === 4 && !form.title.trim()) return;
    setStep(s => (s + 1) as 1 | 2 | 3 | 4 | 5);
  }

  const PAYER_MAP: Record<string, string> = {
    customer: 'PEOPLE', instructor: 'INSTRUCTOR', partner: 'PARTNER',
    employee: 'EMPLOYEE', company: 'COMPANY',
  };

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div className="flex items-start justify-between px-5 py-4 border-b border-line gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink">Editar título</span>
          <div className="flex items-center gap-1">
            {([1, 2, 3, 4, 5] as const).map((n, i) => (
              <span key={n} className="flex items-center gap-1">
                <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${step === n ? 'bg-accent text-white' : step > n ? 'bg-success text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                {i < 4 && <ChevronRight size={10} className="text-ink-3" />}
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
                <button key={value}
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
                  <input inputMode="numeric" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: maskCurrency(e.target.value) }))} />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-1.5"><label className="text-[12px] font-medium text-ink-2">Aeronave</label>
            <Select value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
              <option value="">Sem aeronave</option>
              {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''}</option>)}
            </Select>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer justify="between">
        <div>
          {step > 1 && <Button variant="default" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3 | 4 | 5)}><ChevronLeft size={14} /> Voltar</Button>}
        </div>
        <div className="flex items-center gap-2">
          {step === 1 && <Button variant="default" onClick={onClose}>Cancelar</Button>}
          {step < 5
            ? <Button variant="primary" onClick={goNext}>Próximo <ChevronRight size={14} /></Button>
            : <Button variant="primary" onClick={() => onSave({
                title: form.title,
                description: form.description || undefined,
                receivable_type_id: form.receivable_type_id ? Number(form.receivable_type_id) : undefined,
                expiration_date: form.expiration_date || undefined,
                total_amount: parseCurrency(form.total_amount),
                plane_id: form.plane_id ? Number(form.plane_id) : undefined,
                stakeholder: PAYER_MAP[form.payer_type] ?? 'NONE',
                person_id: form.payer_type === 'customer' && form.payer_id ? Number(form.payer_id) : undefined,
                company_id: form.payer_type === 'company' && form.payer_id ? Number(form.payer_id) : undefined,
                instructor_id: form.payer_type === 'instructor' && form.payer_id ? Number(form.payer_id) : undefined,
                partner_id: form.payer_type === 'partner' && form.payer_id ? Number(form.payer_id) : undefined,
                employee_id: form.payer_type === 'employee' && form.payer_id ? Number(form.payer_id) : undefined,
              })}><CheckIcon size={14} /> Salvar</Button>
          }
        </div>
      </Modal.Footer>
    </Modal>
  );
}
