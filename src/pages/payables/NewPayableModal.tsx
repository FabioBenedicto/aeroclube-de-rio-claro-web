import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check as CheckIcon, User, UserCheck, Users, Briefcase, Building2, Wrench, BookOpen, Settings, Package } from 'lucide-react';
import DateInput from '../../components/DateInput';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import type { Plane, Company } from '../../types';
import { toast } from '../../utils/toast';

type NamedOption = { id: number; name: string };

const modalBase = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
const modalPanel = 'bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]';
const modalHead = 'flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3';
const modalBody = 'p-[18px] overflow-y-auto flex-1 flex flex-col gap-4';
const modalFoot = 'flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line';
const field = 'flex flex-col gap-1.5';
const lbl = 'text-[12px] font-medium text-ink-2';
const inp = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]';
const sel = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] cursor-pointer';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

const PRODUCT_TYPES_PAY = [
  { value: 'servico',    label: 'Serviço',    Icon: Wrench },
  { value: 'instrucao',  label: 'Instrução',  Icon: BookOpen },
  { value: 'manutencao', label: 'Manutenção', Icon: Settings },
  { value: 'outro',      label: 'Outro',      Icon: Package },
] as const;

const PAYER_TYPES_PAY = [
  { value: 'customer',   label: 'Pessoa',     Icon: User },
  { value: 'instructor', label: 'Instrutor',  Icon: UserCheck },
  { value: 'partner',    label: 'Sócio',      Icon: Users },
  { value: 'employee',   label: 'Funcionário',Icon: Briefcase },
  { value: 'company',    label: 'Empresa',    Icon: Building2 },
] as const;

export function NewPayableModal({ customers, instructors, partners, employees, planes, companies, onClose, onSave }: {
  customers: NamedOption[];
  instructors: NamedOption[];
  partners: NamedOption[];
  employees: NamedOption[];
  planes: Plane[];
  companies: Company[];
  onClose: () => void;
  onSave: (d: unknown) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [form, setForm] = useState({
    payer_type: '', payer_id: '', plane_id: '',
    title: '', description: '', amount: '', due_date: '',
    product: '', recurrence: '', occurrences: '2',
  });

  const payerLists: Record<string, NamedOption[]> = { customer: customers, company: companies, instructor: instructors, partner: partners, employee: employees };
  const payerList = payerLists[form.payer_type] ?? [];

  function goNext() {
    if (step === 1 && !form.product) { toast.error('Selecione o tipo de título'); return; }
    if (step === 2 && !form.payer_type) { toast.error('Selecione o tipo de recebedor'); return; }
    if (step === 3 && !form.payer_id) { toast.error('Selecione o recebedor'); return; }
    if (step === 4 && !form.title.trim()) { toast.error('Título é obrigatório'); return; }
    setStep(s => (s + 1) as 1 | 2 | 3 | 4 | 5 | 6);
  }

  return (
    <div className={modalBase} onClick={onClose}>
      <div className={modalPanel} onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0">Novo título a pagar</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map((n, i) => (
                <span key={n} className="flex items-center gap-1">
                  <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${step === n ? 'bg-accent text-white' : step > n ? 'bg-success text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                  {i < 5 && <ChevronRight size={10} className="text-ink-4" />}
                </span>
              ))}
            </div>
          </div>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={modalBody}>
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5">
              {PRODUCT_TYPES_PAY.map(({ value, label, Icon }) => {
                const active = form.product === value;
                return (
                  <button
                    key={value}
                    className={`flex flex-col items-center gap-2 py-5 px-2 rounded-lg border-2 cursor-pointer transition-colors ${active ? 'border-accent bg-accent-soft' : 'border-line bg-bg hover:bg-bg-hover'}`}
                    onClick={() => setForm(f => ({ ...f, product: value }))}
                  >
                    <Icon size={24} className={active ? 'text-accent' : 'text-ink-3'} />
                    <span className={`text-[12px] font-medium ${active ? 'text-accent-ink' : 'text-ink-2'}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-3 gap-2.5">
              {PAYER_TYPES_PAY.map(({ value, label, Icon }) => {
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
            <div className={field}>
              <label className={lbl}>Selecionar recebedor</label>
              <select className={sel} value={form.payer_id} onChange={e => setForm(f => ({ ...f, payer_id: e.target.value }))}>
                <option value="">Selecione</option>
                {payerList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {step === 4 && (
            <>
              <div className={field}><label className={lbl}>Título</label>
                <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className={field}><label className={lbl}>Descrição</label>
                <textarea className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] resize-y min-h-[60px]" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={field}><label className={lbl}>Vencimento</label>
                  <DateInput value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} />
                </div>
                <div className={field}><label className={lbl}>Valor</label>
                  <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                    <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                    <input inputMode="numeric" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: maskCurrency(e.target.value) }))} />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <div className={field}>
              <label className={lbl}>Aeronave</label>
              <select className={sel} value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
                <option value="">Sem aeronave</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''}</option>)}
              </select>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className={field}><label className={lbl}>Repetir</label>
                  <select className={sel} value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                    <option value="">Sem recorrência</option>
                    <option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="yearly">Anual</option>
                  </select>
                </div>
                <div className={field}><label className={lbl}>Nº de ocorrências</label>
                  <input type="number" className={inp + ' font-mono'} min={2} max={60} value={form.occurrences} onChange={e => setForm(f => ({ ...f, occurrences: e.target.value }))} disabled={!form.recurrence} />
                </div>
              </div>
              {form.recurrence && (
                <div className="text-[12px] text-ink-3">
                  Serão criados <strong>{form.occurrences}</strong> títulos com vencimentos {form.recurrence === 'monthly' ? 'mensais' : form.recurrence === 'weekly' ? 'semanais' : 'anuais'}, a partir da data informada.
                </div>
              )}
            </div>
          )}
        </div>

        <div className={modalFoot} style={{ justifyContent: 'space-between' }}>
          <div>
            {step > 1 && <button className={btnCancel} onClick={() => setStep(s => (s - 1) as 1 | 2 | 3 | 4 | 5 | 6)}><ChevronLeft size={14} /> Voltar</button>}
          </div>
          <div className="flex items-center gap-2">
            {step === 1 && <button className={btnCancel} onClick={onClose}>Cancelar</button>}
            {step < 6
              ? <button className={btnPrimary} onClick={goNext}>Próximo <ChevronRight size={14} /></button>
              : <button className={btnPrimary} onClick={() => onSave({
                payer_type: form.payer_type,
                ...(form.payer_type === 'customer' && form.payer_id && { client_id: Number(form.payer_id) }),
                ...(form.payer_type === 'company' && form.payer_id && { company_id: Number(form.payer_id) }),
                ...(form.payer_type === 'instructor' && form.payer_id && { instructor_id: Number(form.payer_id) }),
                ...(form.payer_type === 'partner' && form.payer_id && { partner_id: Number(form.payer_id) }),
                ...(form.payer_type === 'employee' && form.payer_id && { employee_id: Number(form.payer_id) }),
                plane_id: form.plane_id ? Number(form.plane_id) : undefined,
                title: form.title,
                description: form.description || undefined,
                amount: parseCurrency(form.amount),
                due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
                product: form.product,
                recurrence: form.recurrence || undefined,
                occurrences: form.recurrence ? Number(form.occurrences) : undefined,
              })}>
                <CheckIcon size={14} /> Criar título
              </button>}
          </div>
        </div>
      </div>
    </div>
  );
}
