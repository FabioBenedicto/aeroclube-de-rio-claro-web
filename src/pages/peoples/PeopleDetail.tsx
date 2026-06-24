import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Check, X, Edit, Trash2, MoreHorizontal, Eye, ChevronRight, Plane as PlaneIcon, Timer, ArrowDownLeft, Clock, ArrowUpRight, Hourglass, BarChart3, Calendar, Wrench, Package } from 'lucide-react';
import { getPeople, getPeoples, updatePeople } from '../../api/peoples';
import { getReceivables, createReceivable, updateReceivable, deleteReceivable, bulkDeleteReceivables, registerPayment } from '../../api/receivables';
import { getPayables, getPayableStats, deletePayable, bulkDeletePayables, registerPayablePayment } from '../../api/payables';
import { getFlights, getFlightStats, createFlight, updateFlight, closeFlight, deleteFlight, bulkDeleteFlights } from '../../api/flights';
import { createBill, deleteBill, bulkDeleteBills, getBillsByCustomer } from '../../api/invoices';
import { getPlanes } from '../../api/planes';
import { getReceivableTypes } from '../../api/receivable-types';
import DateInput from '../../components/DateInput';
import PayModal from '../../components/PayModal';
import { formatBRL, formatDate, formatHours, receivableStatus, payableStatus, STATUS_LABEL, STATUS_BADGE, PAYABLE_STATUS_LABEL, BILL_STATUS_BADGE, BILL_STATUS_LABEL } from '../../utils/format';
import ProgressBar from '../../components/ui/ProgressBar';
import FlightModal from '../flights/FlightModal';
import CloseFlightModal from '../flights/CloseFlightModal';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';
import Checkbox from '../../components/ui/Checkbox';
import type { Receivable, Flight, Payable, Bill } from '../../types';
import Table, { type TableColumn } from '../../components/ui/Table';
import PeopleModal from './PeopleModal';
import { toast, extractErrorMessage } from '../../utils/toast';
import Button from '../../components/ui/Button';
import Combobox from '../../components/ui/Combobox';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import Skeleton from '../../components/ui/Skeleton';

type MenuState = { id: number; top: number; right: number };
type BadgeVariant = 'success' | 'warn' | 'danger' | 'accent' | 'default';
type ChipVariant = 'aluno' | 'socio' | 'instrutor' | 'funcionario' | 'default';


const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';



function NewCreditModal({ personId, onClose, onSuccess }: { personId: number; onClose: () => void; onSuccess: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ title: '', description: '', expiration_date: '', amount: '', receivable_type_id: '' });

  const { data: receivableTypes = [] } = useQuery({ queryKey: ['receivable-types'], queryFn: getReceivableTypes });

  const step1Valid = parseFloat(form.amount) > 0;
  const step2Valid = form.title.trim() !== '' && !!form.receivable_type_id && !!form.expiration_date;

  const mut = useMutation({
    mutationFn: () => createReceivable({
      person_id: personId,
      stakeholder: 'PEOPLE',
      title: form.title,
      total_amount: parseFloat(form.amount),
      adds_credit: true,
      receivable_type_id: form.receivable_type_id ? Number(form.receivable_type_id) : undefined,
      ...(form.description && { description: form.description }),
      ...(form.expiration_date && { expiration_date: form.expiration_date }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people', personId] });
      onSuccess();
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0">Adicionar crédito</h3>
            <div className="flex items-center gap-1.5">
              {(['Valor', 'Título'] as const).map((label, i) => {
                const n = (i + 1) as 1 | 2;
                return (
                  <span key={n} className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${step === n ? 'bg-accent text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                    <span className="text-[11px] text-ink-3">{label}</span>
                    {i < 1 && <ChevronRight size={12} className="text-ink-3" />}
                  </span>
                );
              })}
            </div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        {step === 1 && (
          <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor do crédito *</label>
              <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg border-r border-line select-none">R$</span>
                <input type="number" step="0.01" min="0.01" autoFocus className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Tipo de título *</label>
              <Select
                value={form.receivable_type_id}
                onChange={e => setForm(f => ({ ...f, receivable_type_id: e.target.value }))}
              >
                <option value="">Selecione</option>
                {receivableTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Título *</label>
              <Input placeholder="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Descrição</label>
              <Textarea placeholder="Descrição" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Data de vencimento *</label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={step === 1 ? onClose : () => setStep(1)}>
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {step === 1 ? (
            <Button variant="primary" disabled={!step1Valid} onClick={() => setStep(2)}>Próximo <ChevronRight size={14} /></Button>
          ) : (
            <Button variant="primary" disabled={!step2Valid || mut.isPending} onClick={() => mut.mutate()}>
              <Check size={14} /> {mut.isPending ? 'Salvando…' : 'Confirmar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewTituloModal({ personId, onClose, onSave }: { personId: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: '', receivable_type_id: '', expiration_date: '', total_amount: '', plane_id: '', flight_id: '' });
  const { data: planesData } = useQuery({ queryKey: ['planes-all'], queryFn: () => getPlanes(1, 100) });
  const planes = planesData?.data ?? [];
  const { data: receivableTypes = [] } = useQuery({ queryKey: ['receivable-types'], queryFn: getReceivableTypes });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">Novo título a receber</h3>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Descrição do título</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Tipo</label>
              <Select value={form.receivable_type_id} onChange={e => setForm(f => ({ ...f, receivable_type_id: e.target.value }))}>
                <option value="">Sem tipo</option>
                {receivableTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Aeronave <span className="text-ink-3 font-normal">(opcional)</span></label>
              <Select value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
                <option value="">—</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Voo Nº <span className="text-ink-3 font-normal">(opcional)</span></label>
              <Input type="number" placeholder="ID do voo" value={form.flight_id} onChange={e => setForm(f => ({ ...f, flight_id: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Valor</label>
            <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100" style={{ maxWidth: 220 }}>
              <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg border-r border-line select-none">R$</span>
              <input type="number" step="0.01" className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0" placeholder="0,00" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave({
            person_id: personId,
            title: form.title,
            receivable_type_id: form.receivable_type_id ? parseInt(form.receivable_type_id) : undefined,
            expiration_date: form.expiration_date || undefined,
            total_amount: parseFloat(form.total_amount),
            stakeholder: 'PEOPLE',
            ...(form.plane_id && { plane_id: parseInt(form.plane_id) }),
            ...(form.flight_id && { flight_id: parseInt(form.flight_id) }),
          })}>
            <Check size={14} /> Criar título
          </Button>
        </div>
      </div>
    </div>
  );
}

const EDIT_PRODUCT_TYPES = [
  { value: 'voo',         label: 'Voo',        Icon: PlaneIcon },
  { value: 'mensalidade', label: 'Mensalidade', Icon: Calendar },
  { value: 'servico',     label: 'Serviço',     Icon: Wrench },
  { value: 'outro',       label: 'Outro',       Icon: Package },
] as const;

function EditTituloModal({ rec, onClose, onSave }: { rec: Receivable; onClose: () => void; onSave: (d: unknown) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    product: rec.product ?? 'voo',
    title: rec.title,
    description: rec.description ?? '',
    expiration_date: rec.expiration_date?.slice(0, 10) ?? '',
    total_amount: rec.total_amount ? maskCurrency(String(Math.round(Number(rec.total_amount) * 100))) : '',
    plane_id: rec.plane_id ? String(rec.plane_id) : '',
  });
  const { data: planesData } = useQuery({ queryKey: ['planes-all'], queryFn: () => getPlanes(1, 100) });
  const planes = planesData?.data ?? [];

  function goNext() {
    if (step === 2 && !form.title.trim()) { toast.error('Título é obrigatório'); return; }
    setStep(s => (s + 1) as 1 | 2 | 3);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0">Editar título</h3>
            <div className="flex items-center gap-1">
              {([1, 2, 3] as const).map((n, i) => (
                <span key={n} className="flex items-center gap-1">
                  <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${step === n ? 'bg-accent text-white' : step > n ? 'bg-success text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                  {i < 2 && <ChevronRight size={10} className="text-ink-3" />}
                </span>
              ))}
            </div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>

        <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5">
              {EDIT_PRODUCT_TYPES.map(({ value, label, Icon }) => {
                const active = form.product === value;
                return (
                  <button key={value}
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
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Título</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Descrição</label>
                <Textarea className="min-h-[60px]" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
                  <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Valor</label>
                  <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                    <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                    <input inputMode="numeric" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: maskCurrency(e.target.value) }))} />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Aeronave</label>
              <Select value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
                <option value="">Sem aeronave</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''}</option>)}
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-[18px] py-3.5 border-t border-line flex-shrink-0">
          <div>
            {step > 1 && <Button variant="default" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}><ChevronLeft size={14} /> Voltar</Button>}
          </div>
          <div className="flex items-center gap-2">
            {step === 1 && <Button variant="default" onClick={onClose}>Cancelar</Button>}
            {step < 3
              ? <Button variant="primary" onClick={goNext}>Próximo <ChevronRight size={14} /></Button>
              : <Button variant="primary" onClick={() => onSave({
                  title: form.title,
                  description: form.description || undefined,
                  type: form.product,
                  expiration_date: form.expiration_date || undefined,
                  total_amount: parseCurrency(form.total_amount),
                  plane_id: form.plane_id ? Number(form.plane_id) : undefined,
                })}><Check size={14} /> Salvar</Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function SettleTituloModal({ rec, creditBalance = 0, onClose, onSave }: { rec: Receivable; creditBalance?: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const remaining = Number(rec.total_amount) - Number(rec.amount_received);
  const [mode, setMode] = useState<'total' | 'partial'>('total');
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('pix');
  const [useCredit, setUseCredit] = useState(false);

  const creditToApply = useCredit ? Math.min(creditBalance, remaining) : 0;
  const cashNeeded = Math.max(0, remaining - creditToApply);
  const effectiveCash = mode === 'total' ? cashNeeded : parseFloat(amount) || 0;
  const totalEffective = Math.min(creditToApply + effectiveCash, remaining);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold m-0">Registrar recebimento</h3>
            <div className="text-[11.5px] text-ink-3 mt-0.5">{rec.id}</div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 px-3.5 py-3 bg-bg-sunk rounded-md">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-0.5">Título</div>
              <div className="font-medium">{rec.title}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-0.5">Saldo devedor</div>
              <div className="font-mono text-[16px] font-semibold">R$ {formatBRL(remaining)}</div>
            </div>
          </div>

          {creditBalance > 0 && (
            <label className="flex items-center gap-3 px-3.5 py-3 rounded-md border cursor-pointer select-none transition-colors" style={{ borderColor: useCredit ? 'var(--accent)' : 'var(--line)', background: useCredit ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : undefined }}>
              <Checkbox checked={useCredit} onChange={e => setUseCredit(e.target.checked)} />
              <div className="flex-1">
                <div className="text-[13px] font-medium">Usar crédito disponível</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">Saldo: <span className="font-mono font-semibold" style={{ color: 'var(--success)' }}>R$ {formatBRL(creditBalance)}</span> · será aplicado R$ {formatBRL(creditToApply)}</div>
              </div>
            </label>
          )}

          {useCredit && creditToApply >= remaining ? null : (
            <>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-2">
                  {useCredit ? 'Valor restante em dinheiro' : 'Tipo de recebimento'}
                </div>
                {!useCredit && (
                  <div className="flex gap-2">
                    <button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer ${mode === 'total' ? 'bg-accent border border-accent text-white hover:opacity-90' : 'border border-line bg-bg-elev text-ink-2 hover:bg-bg-hover hover:text-ink'}`} onClick={() => setMode('total')}>Total · R$ {formatBRL(cashNeeded)}</button>
                    <button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer ${mode === 'partial' ? 'bg-accent border border-accent text-white hover:opacity-90' : 'border border-line bg-bg-elev text-ink-2 hover:bg-bg-hover hover:text-ink'}`} onClick={() => setMode('partial')}>Parcial</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Valor recebido</label>
                  <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                    <span className="flex items-center px-2.5 text-[13px] font-mono text-ink-3 bg-bg border-r border-line select-none">R$</span>
                    <input className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0 disabled:opacity-60" type="number" step="0.01" value={useCredit ? String(cashNeeded) : (mode === 'total' ? String(remaining) : amount)} onChange={e => setAmount(e.target.value)} disabled={mode === 'total' || useCredit} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
                  <Select value={method} onChange={e => setMethod(e.target.value)}>
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência</option>
                    <option value="credito">Cartão de crédito</option>
                    <option value="debito">Cartão de débito</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <span className="text-[11.5px] text-ink-3 mr-auto">Saldo restante: <strong className="font-mono">R$ {formatBRL(Math.max(0, remaining - totalEffective))}</strong></span>
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave({ amount_received: effectiveCash, payment_method: method, payment_date: new Date().toISOString(), use_credit: useCredit })}><Check size={14} /> Confirmar recebimento</Button>
        </div>
      </div>
    </div>
  );
}

function NewFaturaModal({ receivables, personId, onClose, onSave }: { receivables: Receivable[]; personId: number; onClose: () => void; onSave: (d: { customer_id: number; items: { receivable_id: number; amount: number }[]; payment_method?: string; due_date?: string }) => void }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [method, setMethod] = useState('pix');
  const [dueDate, setDueDate] = useState('');
  const openRecs = receivables.filter(r => receivableStatus(r) !== 'paid');
  const total = Object.values(selected).reduce((s, v) => s + v, 0);

  function toggleRec(r: Receivable) {
    const remaining = Number(r.total_amount) - Number(r.amount_received);
    setSelected(s => s[r.id] !== undefined
      ? Object.fromEntries(Object.entries(s).filter(([k]) => Number(k) !== r.id))
      : { ...s, [r.id]: remaining }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[520px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">Nova fatura</h3>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="px-[18px] py-3.5 border-b border-line">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
                <Select value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência</option>
                  <option value="credito">Cartão de crédito</option>
                  <option value="debito">Cartão de débito</option>
                  <option value="cheque">Cheque</option>
                  <option value="boleto">Boleto</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Vencimento <span className="text-ink-3 font-normal">(opcional)</span></label>
                <DateInput value={dueDate} onChange={setDueDate} />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={thCls}></th><th className={thCls}>Título</th>
                  <th className={thNumCls}>Valor</th><th className={thNumCls}>Recebido</th><th className={thNumCls}>A incluir</th>
                </tr>
              </thead>
              <tbody>
                {openRecs.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título em aberto.</td></tr>}
                {openRecs.map(r => {
                  const remaining = Number(r.total_amount) - Number(r.amount_received);
                  const checked = r.id in selected;
                  return (
                    <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => toggleRec(r)}>
                      <td className={tdCls}><Checkbox checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} /></td>
                      <td className={tdCls}>{r.title}</td>
                      <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(r.total_amount)}</td>
                      <td className={`${tdCls} text-right font-mono`}>{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                      <td className={`${tdCls} text-right font-mono`}>
                        {checked ? (
                          <input type="number" step="0.01" min="0.01" max={remaining}
                            className="font-mono text-[12px] px-1.5 py-0.5 bg-bg border border-line rounded text-ink outline-none focus:border-accent"
                            style={{ width: 90 }}
                            value={selected[r.id]} onClick={e => e.stopPropagation()}
                            onChange={e => { const v = Math.min(parseFloat(e.target.value) || 0, remaining); setSelected(s => ({ ...s, [r.id]: v })); }} />
                        ) : `R$ ${formatBRL(remaining)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-[18px] py-3 border-t border-line">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Total selecionado</span>
            <span className="font-mono font-semibold">R$ {formatBRL(total)}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={Object.keys(selected).length === 0 || total <= 0}
            onClick={() => onSave({ customer_id: personId, payment_method: method, ...(dueDate && { due_date: dueDate }), items: Object.entries(selected).map(([id, amount]) => ({ receivable_id: Number(id), amount })) })}>
            <Check size={14} /> Gerar fatura
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PeopleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const peopleId = Number(id);
  const PAGE_SIZE = 10;
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tabPages, setTabPages] = useState<Record<string, number>>({ voos: 1, voos_socio: 1, receber: 1, pagar: 1, faturas: 1, mensalidades: 1, voos_instrutor: 1, titulos_instrutor: 1, func_pagar: 1 });
  const setTabPage = (t: string, page: number) => setTabPages(p => ({ ...p, [t]: page }));

  const { data: people, isLoading } = useQuery({ queryKey: ['people', peopleId], queryFn: () => getPeople(peopleId) });
  const { data: billsResponse } = useQuery({
    queryKey: ['bills', peopleId, tabPages.faturas, dateFrom, dateTo],
    queryFn: () => getBillsByCustomer(peopleId, tabPages.faturas, PAGE_SIZE, dateFrom || undefined, dateTo || undefined),
    placeholderData: (prev: any) => prev,
  });
  const bills = billsResponse?.data ?? [];
  const { data: planesResponse } = useQuery({ queryKey: ['planes'], queryFn: () => getPlanes() });
  const planes = planesResponse?.data ?? [];
  const { data: allCustomersResponse } = useQuery({ queryKey: ['peoples'], queryFn: () => getPeoples() });
  const allPeoples = allCustomersResponse?.data ?? [];
  const { data: payablesData } = useQuery({
    queryKey: ['payables', 'people', peopleId, tabPages.pagar, dateFrom, dateTo],
    queryFn: () => getPayables(undefined, tabPages.pagar, PAGE_SIZE, peopleId, undefined, dateFrom || undefined, dateTo || undefined),
    placeholderData: (prev: any) => prev,
  });
  const customerPayables = payablesData?.data ?? [];
  const { data: receivablesTabData } = useQuery({
    queryKey: ['receivables', 'people', peopleId, tabPages.receber, dateFrom, dateTo],
    queryFn: () => getReceivables(undefined, undefined, dateFrom || undefined, dateTo || undefined, tabPages.receber, PAGE_SIZE, peopleId),
    placeholderData: (prev: any) => prev,
  });
  const studentId = people?.students?.id;
  const partnerId = people?.partners?.id;

  const { data: flightsStudentData } = useQuery({
    queryKey: ['flights', 'student', studentId, tabPages.voos, dateFrom, dateTo],
    queryFn: () => getFlights(tabPages.voos, PAGE_SIZE, undefined, undefined, undefined, dateFrom || undefined, dateTo || undefined, undefined, undefined, studentId),
    enabled: !!studentId,
    placeholderData: (prev: any) => prev,
  });
  const { data: studentFlightStats } = useQuery({
    queryKey: ['flights', 'stats', 'student', studentId, dateFrom, dateTo],
    queryFn: () => getFlightStats({ studentId }),
    enabled: !!studentId,
  });
  const { data: flightsPartnerData } = useQuery({
    queryKey: ['flights', 'partner', partnerId, tabPages.voos_socio],
    queryFn: () => getFlights(tabPages.voos_socio ?? 1, PAGE_SIZE, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, partnerId),
    enabled: !!partnerId,
    placeholderData: (prev: any) => prev,
  });
  const { data: partnerFlightStats } = useQuery({
    queryKey: ['flights', 'stats', 'partner', partnerId],
    queryFn: () => getFlightStats({ partnerId }),
    enabled: !!partnerId,
  });

  const instructorId = people?.instructors?.id;
  const { data: instructorFlightsData } = useQuery({
    queryKey: ['flights', 'instructor', instructorId, tabPages['voos_instrutor']],
    queryFn: () => getFlights(tabPages['voos_instrutor'] ?? 1, PAGE_SIZE, undefined, undefined, undefined, undefined, undefined, undefined, instructorId),
    enabled: !!instructorId && people?.categories?.includes('instructor'),
    placeholderData: (prev: any) => prev,
  });
  const instructorFlights = instructorFlightsData?.data ?? [];

  const { data: instructorPayablesData } = useQuery({
    queryKey: ['payables', 'instructor', instructorId, tabPages['titulos_instrutor']],
    queryFn: () => getPayables(undefined, tabPages['titulos_instrutor'] ?? 1, PAGE_SIZE, undefined, undefined, undefined, undefined, instructorId),
    enabled: !!instructorId && people?.categories?.includes('instructor'),
    placeholderData: (prev: any) => prev,
  });
  const instructorPayables = instructorPayablesData?.data ?? [];

  const employeeId = people?.employees?.id;
  const { data: employeePayablesData } = useQuery({
    queryKey: ['payables', 'employee', employeeId, tabPages['func_pagar']],
    queryFn: () => getPayables(undefined, tabPages['func_pagar'] ?? 1, PAGE_SIZE, undefined, undefined, undefined, undefined, undefined, employeeId),
    enabled: !!employeeId && people?.categories?.includes('employee'),
    placeholderData: (prev: any) => prev,
  });
  const employeePayables = employeePayablesData?.data ?? [];

  const { data: instructorFlightStats } = useQuery({
    queryKey: ['flights', 'stats', 'instructor', instructorId],
    queryFn: () => getFlightStats({ instructorId }),
    enabled: !!instructorId && people?.categories?.includes('instructor'),
  });
  const { data: personPayableStats } = useQuery({
    queryKey: ['payables', 'stats', 'person', peopleId],
    queryFn: () => getPayableStats({ personId: peopleId }),
  });
  const { data: instrPayableStats } = useQuery({
    queryKey: ['payables', 'stats', 'instructor', instructorId],
    queryFn: () => getPayableStats({ instructorId }),
    enabled: !!instructorId && people?.categories?.includes('instructor'),
  });
  const { data: empPayableStats } = useQuery({
    queryKey: ['payables', 'stats', 'employee', employeeId],
    queryFn: () => getPayableStats({ employeeId }),
    enabled: !!employeeId && people?.categories?.includes('employee'),
  });

  const [roleTab, setRoleTab] = useState('pessoa');
  const [alunoTab, setAlunoTab] = useState('receber');
  const [alunoSubTab, setAlunoSubTab] = useState('voos');
  const [socioSubTab, setSocioSubTab] = useState('voos');
  const [instrTab, setInstrTab] = useState('voos_instrutor');

  const [tituloMenu, setTituloMenu] = useState<MenuState | null>(null);
  const [vooMenu, setVooMenu] = useState<MenuState | null>(null);
  const [faturaMenu, setFaturaMenu] = useState<MenuState | null>(null);
  const [payableMenu, setPayableMenu] = useState<MenuState | null>(null);

  const [creditModal, setCreditModal] = useState(false);
  const [newTituloModal, setNewTituloModal] = useState(false);
  const [newVooModal, setNewVooModal] = useState<'student' | 'partner' | null>(null);
  const [newFaturaModal, setNewFaturaModal] = useState(false);

  const [editTitulo, setEditTitulo] = useState<Receivable | null>(null);
  const [settleTitulo, setSettleTitulo] = useState<Receivable | null>(null);
  const [editVoo, setEditVoo] = useState<Flight | null>(null);
  const [closeVoo, setCloseVoo] = useState<Flight | null>(null);
  const [payPayable, setPayPayable] = useState<Payable | null>(null);
  const [editPeopleModal, setEditPeopleModal] = useState(false);

  const [selectedRec, setSelectedRec] = useState<Set<number>>(new Set());
  const [selectedVoo, setSelectedVoo] = useState<Set<number>>(new Set());
  const [selectedFatura, setSelectedFatura] = useState<Set<number>>(new Set());
  const [selectedPagar, setSelectedPagar] = useState<Set<number>>(new Set());

  const updatePeopleMut = useMutation({
    mutationFn: (data: unknown) => updatePeople(peopleId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); setEditPeopleModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const createTituloMut = useMutation({
    mutationFn: createReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setNewTituloModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateTituloMut = useMutation({
    mutationFn: ({ id: rid, data }: { id: number; data: unknown }) => updateReceivable(rid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setEditTitulo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteTituloMut = useMutation({
    mutationFn: deleteReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteRecMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteReceivables(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelectedRec(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const settleMut = useMutation({
    mutationFn: ({ id: rid, data }: { id: number; data: Parameters<typeof registerPayment>[1] }) => registerPayment(rid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSettleTitulo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const createVooMut = useMutation({
    mutationFn: createFlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setNewVooModal(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateVooMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updateFlight(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setEditVoo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const closeVooMut = useMutation({
    mutationFn: ({ id: fid, end_date }: { id: number; end_date: string }) => closeFlight(fid, end_date),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setCloseVoo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteVooMut = useMutation({
    mutationFn: deleteFlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['flights'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteVooMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteFlights(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setSelectedVoo(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const createFaturaMut = useMutation({
    mutationFn: createBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', peopleId] }); qc.invalidateQueries({ queryKey: ['people', peopleId] }); setNewFaturaModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteFaturaMut = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', peopleId] }); qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteFaturaMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteBills(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', peopleId] }); qc.invalidateQueries({ queryKey: ['people', peopleId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelectedFatura(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const invalidatePayableStats = () => qc.invalidateQueries({ queryKey: ['payables', 'stats'] });
  const deletePayableMut = useMutation({
    mutationFn: deletePayable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables', 'people', peopleId] }); invalidatePayableStats(); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeletePayableMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeletePayables(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables', 'people', peopleId] }); invalidatePayableStats(); setSelectedPagar(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const payMut = useMutation({
    mutationFn: (d: unknown) => registerPayablePayment(payPayable!.id, d as { amount: number; method?: string; payment_date?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables', 'people', peopleId] }); invalidatePayableStats(); setPayPayable(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton.Block className="h-[13px] w-14 mb-1" />
          <Skeleton.Title width="w-56" />
          <div className="flex items-center gap-2 mt-1">
            <Skeleton.Block className="h-5 w-12 rounded-full" />
            <Skeleton.Block className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton.Text width="w-72" />
        </div>
        <div className="flex flex-col items-end gap-3 mt-6">
          <div className="flex items-center gap-2">
            <Skeleton.Block className="h-8 w-36 rounded-lg" />
            <Skeleton.Block className="h-8 w-20 rounded-lg" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton.Block className="h-7 w-28 rounded" />
            <Skeleton.Text width="w-24" />
          </div>
        </div>
      </div>
      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <Skeleton.Card key={i} />)}
        </div>
        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 border-b border-line"><Skeleton.Text width="w-32" /></div>
          <table className="w-full border-collapse">
            <tbody><Skeleton.TableRows cols={6} rows={6} /></tbody>
          </table>
        </div>
      </div>
    </div>
  );
  if (!people) return <div className="p-8 text-[13px] text-ink-3">Pessoa não encontrada.</div>;

  const recColumns: TableColumn<Receivable>[] = [
    { key: 'checkbox', label: '', headerClassName: 'w-9', cellClassName: 'w-9', stopPropagation: true, render: r => <Checkbox checked={selectedRec.has(r.id)} onChange={() => toggleOneRec(r.id)} /> },
    { key: 'id', label: 'ID', render: r => <span className="font-mono text-[11.5px]">{r.id}</span> },
    { key: 'title', label: 'Título', render: r => r.title },
    { key: 'product', label: 'Tipo', render: r => { const lbl = r.receivable_type?.name ?? r.product; return lbl ? <Chip>{lbl}</Chip> : '—'; } },
    { key: 'expiration_date', label: 'Vencimento', render: r => <span className="font-mono text-[12px]">{formatDate(r.expiration_date)}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: r => `R$ ${formatBRL(r.total_amount)}` },
    { key: 'amount_received', label: 'Recebido', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: r => `R$ ${formatBRL(r.amount_received)}` },
    { key: 'progress', label: 'Progresso', headerClassName: 'min-w-[120px]', render: r => { const st = receivableStatus(r); const pct = Number(r.total_amount) > 0 ? Math.round((Number(r.amount_received) / Number(r.total_amount)) * 100) : 0; return <ProgressBar pct={pct} isPaid={st === 'paid'} />; } },
    { key: 'status', label: 'Status', render: r => { const st = receivableStatus(r); return <Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge>; } },
    { key: 'actions', label: '', headerClassName: 'w-10', cellClassName: 'w-10', stopPropagation: true, render: r => <Button variant="icon" onClick={e => { e.stopPropagation(); openMenu(setTituloMenu, r.id, e); }}><MoreHorizontal size={15} /></Button> },
  ];

  const recColumnsBasic: TableColumn<Receivable>[] = [
    { key: 'id', label: 'ID', render: r => <span className="font-mono text-[11.5px]">{r.id}</span> },
    { key: 'title', label: 'Título', render: r => r.title },
    { key: 'product', label: 'Tipo', render: r => { const lbl = r.receivable_type?.name ?? r.product; return lbl ? <Chip>{lbl}</Chip> : '—'; } },
    { key: 'expiration_date', label: 'Vencimento', render: r => <span className="font-mono text-[12px]">{formatDate(r.expiration_date)}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: r => `R$ ${formatBRL(r.total_amount)}` },
    { key: 'amount_received', label: 'Recebido', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: r => `R$ ${formatBRL(r.amount_received)}` },
    { key: 'progress', label: 'Progresso', headerClassName: 'min-w-[120px]', render: r => { const st = receivableStatus(r); const pct = Number(r.total_amount) > 0 ? Math.round((Number(r.amount_received) / Number(r.total_amount)) * 100) : 0; return <ProgressBar pct={pct} isPaid={st === 'paid'} />; } },
    { key: 'status', label: 'Status', render: r => { const st = receivableStatus(r); return <Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge>; } },
  ];

  const payColumns: TableColumn<Payable>[] = [
    { key: 'checkbox', label: '', headerClassName: 'w-9', cellClassName: 'w-9', stopPropagation: true, render: p => <Checkbox checked={selectedPagar.has(p.id)} onChange={() => toggleOnePagar(p.id)} /> },
    { key: 'id', label: 'ID', render: p => <span className="font-mono text-[11.5px]">{p.id}</span> },
    { key: 'title', label: 'Título', render: p => <span className="font-medium">{p.title}</span> },
    { key: 'product', label: 'Tipo', render: p => p.payable_type?.name ? <Chip>{p.payable_type.name}</Chip> : '—' },
    { key: 'expiration_date', label: 'Vencimento', render: p => <span className="font-mono text-[12px]">{p.expiration_date ? formatDate(p.expiration_date) : '—'}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: p => `R$ ${formatBRL(p.total_amount)}` },
    { key: 'amount_paid', label: 'Pago', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: p => `R$ ${formatBRL(p.amount_paid)}` },
    { key: 'progress', label: 'Progresso', headerClassName: 'w-32', cellClassName: 'w-32', render: p => { const st = payableStatus(p); const pct = Number(p.total_amount) > 0 ? Math.round((Number(p.amount_paid) / Number(p.total_amount)) * 100) : 0; return <ProgressBar pct={pct} isPaid={st === 'paid'} />; } },
    { key: 'status', label: 'Status', render: p => <Badge variant={STATUS_BADGE[payableStatus(p)] as BadgeVariant}>{PAYABLE_STATUS_LABEL[payableStatus(p)]}</Badge> },
    { key: 'actions', label: '', headerClassName: 'w-10', cellClassName: 'w-10', stopPropagation: true, render: p => <Button variant="icon" onClick={e => { e.stopPropagation(); openMenu(setPayableMenu, p.id, e); }}><MoreHorizontal size={15} /></Button> },
  ];

  const payColumnsBasic: TableColumn<Payable>[] = [
    { key: 'id', label: 'ID', render: p => <span className="font-mono text-[11.5px]">{p.id}</span> },
    { key: 'title', label: 'Título', render: p => p.title },
    { key: 'product', label: 'Tipo', render: p => p.payable_type?.name ? <Chip>{p.payable_type.name}</Chip> : '—' },
    { key: 'expiration_date', label: 'Vencimento', render: p => <span className="font-mono text-[12px]">{p.expiration_date ? formatDate(p.expiration_date) : '—'}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: p => `R$ ${formatBRL(p.total_amount)}` },
    { key: 'amount_paid', label: 'Pago', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: p => `R$ ${formatBRL(p.amount_paid)}` },
    { key: 'progress', label: 'Progresso', headerClassName: 'w-32', cellClassName: 'w-32', render: p => { const st = payableStatus(p); const pct = Number(p.total_amount) > 0 ? Math.round((Number(p.amount_paid) / Number(p.total_amount)) * 100) : 0; return <ProgressBar pct={pct} isPaid={st === 'paid'} />; } },
    { key: 'status', label: 'Status', render: p => <Badge variant={STATUS_BADGE[payableStatus(p)] as BadgeVariant}>{PAYABLE_STATUS_LABEL[payableStatus(p)]}</Badge> },
  ];

  const payColumnsWithTitle: TableColumn<any>[] = [
    { key: 'id', label: 'ID', render: (p: any) => <span className="font-mono text-[11.5px]">{p.id}</span> },
    { key: 'title', label: 'Título', render: (p: any) => <><div className="font-medium">{p.title}</div>{p.product && <div className="text-[11.5px] text-ink-3 mt-0.5">{p.product}</div>}</> },
    { key: 'expiration_date', label: 'Vencimento', render: (p: any) => <span className="font-mono text-[12px]">{p.expiration_date ? formatDate(p.expiration_date) : '—'}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: (p: any) => `R$ ${formatBRL(p.total_amount)}` },
    { key: 'amount_paid', label: 'Pago', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: (p: any) => `R$ ${formatBRL(p.amount_paid)}` },
    { key: 'progress', label: 'Progresso', headerClassName: 'w-32', cellClassName: 'w-32', render: (p: any) => { const st = payableStatus(p); const pct = Number(p.total_amount) > 0 ? Math.round((Number(p.amount_paid) / Number(p.total_amount)) * 100) : 0; return <ProgressBar pct={pct} isPaid={st === 'paid'} />; } },
    { key: 'status', label: 'Status', render: (p: any) => <Badge variant={STATUS_BADGE[payableStatus(p)] as BadgeVariant}>{PAYABLE_STATUS_LABEL[payableStatus(p)]}</Badge> },
  ];

  const faturaColumns: TableColumn<Bill>[] = [
    { key: 'checkbox', label: '', headerClassName: 'w-9', cellClassName: 'w-9', stopPropagation: true, render: b => <Checkbox checked={selectedFatura.has(b.id)} onChange={() => toggleOneFatura(b.id)} /> },
    { key: 'id', label: 'Nº', render: b => <span className="font-mono text-[11.5px]">{b.id}</span> },
    { key: 'issue_date', label: 'Emissão', render: (b: any) => <span className="font-mono text-[12px]">{formatDate(b.issue_date)}</span> },
    { key: 'due_date', label: 'Vencimento', render: b => <span className="font-mono text-[12px]">{b.expiration_date ? formatDate(b.expiration_date) : '—'}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: b => `R$ ${formatBRL(b.total_amount)}` },
    { key: 'items', label: 'Itens', cellClassName: 'text-ink-3 text-[13px]', render: b => { const n = b.receivable_payments?.length ?? 0; return `${n} ${n === 1 ? 'título' : 'títulos'}`; } },
    { key: 'status', label: 'Status', render: b => <Badge variant={BILL_STATUS_BADGE[b.status]}>{BILL_STATUS_LABEL[b.status]}</Badge> },
    { key: 'actions', label: '', headerClassName: 'w-10', cellClassName: 'w-10', stopPropagation: true, render: b => <Button variant="icon" onClick={e => { e.stopPropagation(); openMenu(setFaturaMenu, b.id, e); }}><MoreHorizontal size={15} /></Button> },
  ];

  const vooColumns: TableColumn<Flight>[] = [
    { key: 'checkbox', label: '', headerClassName: 'w-9', cellClassName: 'w-9', stopPropagation: true, render: f => <Checkbox checked={selectedVoo.has(f.id)} onChange={() => toggleOneVoo(f.id)} /> },
    { key: 'id', label: 'ID', render: f => <span className="font-mono text-[11.5px]">{f.id}</span> },
    { key: 'aircraft', label: 'Aeronave', render: f => <span className="font-medium">{f.aircraft?.registration ?? String(f.aircraft_id)}</span> },
    { key: 'instructor', label: 'Instrutor', render: f => f.instructor?.people?.name ?? '—' },
    { key: 'type', label: 'Tipo', render: f => f.type ? <Chip>{f.type}</Chip> : '—' },
    { key: 'route', label: 'Rota', render: f => <span className="font-mono text-[12px]">{f.origin} → {f.destination}</span> },
    { key: 'start_date', label: 'Início', render: f => <span className="font-mono text-[12px]">{formatDate(f.start_date)}</span> },
    { key: 'total_hours', label: 'Horas', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: f => formatHours(f.total_hours) },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: f => f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—' },
    { key: 'actions', label: '', headerClassName: 'w-10', cellClassName: 'w-10', stopPropagation: true, render: f => <Button variant="icon" onClick={e => { e.stopPropagation(); openMenu(setVooMenu, f.id, e); }}><MoreHorizontal size={15} /></Button> },
  ];

  const vooColumnsBasic: TableColumn<Flight>[] = [
    { key: 'id', label: 'ID', render: f => <span className="font-mono text-[11.5px]">{f.id}</span> },
    { key: 'aircraft', label: 'Aeronave', render: f => <span className="font-medium">{f.aircraft?.registration ?? String(f.aircraft_id)}</span> },
    { key: 'instructor', label: 'Instrutor', render: f => f.instructor?.people?.name ?? '—' },
    { key: 'type', label: 'Tipo', render: f => f.type ? <Chip>{f.type}</Chip> : '—' },
    { key: 'route', label: 'Rota', render: f => <span className="font-mono text-[12px]">{f.origin} → {f.destination}</span> },
    { key: 'start_date', label: 'Início', render: f => <span className="font-mono text-[12px]">{formatDate(f.start_date)}</span> },
    { key: 'total_hours', label: 'Horas', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: f => formatHours(f.total_hours) },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: f => f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—' },
  ];

  const instrVooColumns: TableColumn<Flight>[] = [
    { key: 'id', label: 'ID', render: f => <span className="font-mono text-[11.5px]">{f.id}</span> },
    { key: 'people', label: 'Cliente', cellClassName: 'font-medium', render: f => f.people?.name ?? `#${f.people_id}` },
    { key: 'aircraft', label: 'Aeronave', render: f => <span className="font-medium">{f.aircraft?.registration ?? String(f.aircraft_id)}</span> },
    { key: 'type', label: 'Tipo', render: f => f.type ? <Chip>{f.type}</Chip> : '—' },
    { key: 'route', label: 'Rota', render: f => <span className="font-mono text-[12px]">{f.origin} → {f.destination}</span> },
    { key: 'start_date', label: 'Início', render: f => <span className="font-mono text-[12px]">{formatDate(f.start_date)}</span> },
    { key: 'total_hours', label: 'Horas', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: f => formatHours(f.total_hours) },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: f => f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—' },
  ];

  const receivables = people.receivables ?? [];
  const payerReceivables = receivables.filter(r => r.stakeholder === 'PEOPLE' || r.stakeholder == null);
  const mensalidadeRecs = payerReceivables.filter((r: any) => r.product === 'mensalidade');

  const recTab = receivablesTabData?.data ?? [];
  const faturasTab = bills;
  const pagarTab = [...new Map([...customerPayables, ...instructorPayables, ...employeePayables].map(p => [p.id, p])).values()];
  const voosTab = flightsStudentData?.data ?? [];
  const voosSocioTab = flightsPartnerData?.data ?? [];

  const menuTitulo = tituloMenu ? recTab.find(r => r.id === tituloMenu.id) ?? null : null;
  const menuVoo = vooMenu ? ([...voosTab, ...voosSocioTab].find(f => f.id === vooMenu.id)) ?? null : null;
  const menuFatura = faturaMenu ? faturasTab.find(b => b.id === faturaMenu.id) ?? null : null;
  const menuPayable = payableMenu ? pagarTab.find(p => p.id === payableMenu.id) ?? null : null;

  function openMenu(setter: React.Dispatch<React.SetStateAction<MenuState | null>>, id: number, e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setter(s => s?.id === id ? null : { id, top: r.bottom + 4, right: window.innerWidth - r.right });
  }

  const allIdsRec = recTab.map(r => r.id);
  const allSelectedRec = allIdsRec.length > 0 && allIdsRec.every(id => selectedRec.has(id));
  function toggleAllRec() { setSelectedRec(allSelectedRec ? new Set() : new Set(allIdsRec)); }
  function toggleOneRec(id: number) { setSelectedRec(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const allIdsVoo = voosTab.map(f => f.id);
  const allSelectedVoo = allIdsVoo.length > 0 && allIdsVoo.every(id => selectedVoo.has(id));
  function toggleAllVoo() { setSelectedVoo(allSelectedVoo ? new Set() : new Set(allIdsVoo)); }
  function toggleOneVoo(id: number) { setSelectedVoo(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const allIdsFatura = faturasTab.map(b => b.id);
  const allSelectedFatura = allIdsFatura.length > 0 && allIdsFatura.every(id => selectedFatura.has(id));
  function toggleAllFatura() { setSelectedFatura(allSelectedFatura ? new Set() : new Set(allIdsFatura)); }
  function toggleOneFatura(id: number) { setSelectedFatura(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const allIdsPagar = pagarTab.map(p => p.id);
  const allSelectedPagar = allIdsPagar.length > 0 && allIdsPagar.every(id => selectedPagar.has(id));
  function toggleAllPagar() { setSelectedPagar(allSelectedPagar ? new Set() : new Set(allIdsPagar)); }
  function toggleOnePagar(id: number) { setSelectedPagar(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const totalAberto = payerReceivables.reduce((s, r) => s + Math.max(0, Number(r.total_amount) - Number(r.amount_received)), 0);
  const totalRecebido = payerReceivables.reduce((s, r) => s + Number(r.amount_received), 0);
  const totalAPagar = personPayableStats ? Math.max(0, personPayableStats.total_amount - personPayableStats.amount_paid) : 0;
  const totalPago = personPayableStats?.amount_paid ?? 0;
  const creditBalance = people?.credit_balance ?? 0;

  function filterDate<T>(items: T[], key: keyof T): T[] {
    return items.filter(item => {
      const v = item[key];
      const d = typeof v === 'string' ? v.slice(0, 10) : null;
      if (!d) return true;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }
  function pageItems<T>(items: T[], page: number): { rows: T[]; totalPages: number } {
    return { rows: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), totalPages: Math.max(1, Math.ceil(items.length / PAGE_SIZE)) };
  }

  const isAluno = people.categories.includes('student');
  const isInstructor = people.categories.includes('instructor');
  const isPartner = people.categories.includes('partner');
  const isEmployee = people.categories.includes('employee');

  const mensalidadesTotal = mensalidadeRecs.reduce((s, r) => s + Number(r.total_amount), 0);

  const empAPagar = empPayableStats ? Math.max(0, empPayableStats.total_amount - empPayableStats.amount_paid) : 0;
  const empPago = empPayableStats?.amount_paid ?? 0;
  const instrHours = instructorFlightStats?.total_hours ?? 0;
  const instrComissoesTotal = instrPayableStats?.total_amount ?? 0;

  const instrVoosTab = instructorFlights;
  const instrPayTab = instructorPayables;
  const empPayTab = employeePayables;

  const ROLE_TABS = [
    { key: 'pessoa', label: 'Pessoa' },
    ...(isAluno ? [{ key: 'student', label: 'Aluno' }] : []),
    ...(isPartner ? [{ key: 'partner', label: 'Sócio' }] : []),
    ...(isInstructor ? [{ key: 'instructor', label: 'Instrutor' }] : []),
    ...(isEmployee ? [{ key: 'employee', label: 'Funcionário' }] : []),
  ];
  const activeRoleTab = ROLE_TABS.find(t => t.key === roleTab)?.key ?? ROLE_TABS[0].key;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/peoples')}><ChevronLeft size={15} /> Voltar</button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{people.name}</h1>
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {people.categories.map(cat => (
              <Chip key={cat} variant={cat as ChipVariant}>
                {cat === 'partner' ? 'sócio' : cat === 'student' ? 'aluno' : cat === 'instructor' ? 'instrutor' : cat === 'employee' ? 'funcionário' : cat}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[12px] text-ink-3 font-mono">{people.cpf} · {people.email}</span>
            {people.phone_number && <span className="text-[12px] text-ink-3">· {people.phone_number}</span>}
          </div>
          {people.address && (
            <div className="text-[12px] text-ink-3 mt-2">
              {[
                people.address.street,
                people.address.neighborhood,
                people.address.city && people.address.state
                  ? `${people.address.city} - ${people.address.state}`
                  : (people.address.city || people.address.state),
                people.address.zip_code,
              ].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0 mt-6">
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => setCreditModal(true)}><Plus size={14} /> Adicionar crédito</Button>
            <Button variant="default" onClick={() => setEditPeopleModal(true)}><Edit size={14} /> Editar</Button>
          </div>
          <div className="text-right">
            <div className="text-[26px] font-bold font-mono tracking-tight text-ink leading-none">
              <span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(creditBalance)}
            </div>
            <div className="text-[11px] text-ink-3 font-medium mt-1">Créditos disponíveis</div>
          </div>
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-5">
        <div className="flex items-center gap-3 justify-end">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
          <Button variant="primary" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setTabPages(p => ({ ...p, receber: 1, pagar: 1, faturas: 1, voos: 1 })); }}>Aplicar</Button>
        </div>

        <div className="flex border-b border-line">
          {ROLE_TABS.map(t => (
            <button
              key={t.key}
              className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 -mb-px whitespace-nowrap ${activeRoleTab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
              style={{ borderBottomColor: activeRoleTab === t.key ? 'var(--accent)' : 'transparent' }}
              onClick={() => setRoleTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {/* ── PESSOA ── */}
        {activeRoleTab === 'pessoa' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-elev border border-line rounded-lg text-[13px] w-fit mb-3">
                <Calendar size={14} className="text-ink-3 shrink-0" />
                <span className="text-ink-3 font-medium">Criado em</span>
                <span className="font-semibold text-ink">{people?.created_at ? formatDate(people.created_at) : '—'}</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Títulos</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Clock size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Valor a receber</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAberto)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Valor recebido</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalRecebido)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Hourglass size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Valor a pagar</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAPagar)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><ArrowUpRight size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Valor pago</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalPago)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-b border-line">
              {[
                { key: 'receber', label: 'Títulos a receber' },
                { key: 'pagar', label: 'Títulos a pagar' },
                { key: 'faturas', label: 'Faturas' },
              ].map(t => (
                <button key={t.key}
                  className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 -mb-px whitespace-nowrap ${alunoTab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                  style={{ borderBottomColor: alunoTab === t.key ? 'var(--accent)' : 'transparent' }}
                  onClick={() => setAlunoTab(t.key)}
                >{t.label}</button>
              ))}
            </div>

            {alunoTab === 'receber' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
                  <div className="px-0.5 flex items-center">
                    <Checkbox checked={allSelectedRec} onChange={toggleAllRec} />
                  </div>
                  <div className="flex-1" />
                  <Button variant="primary" onClick={() => setNewTituloModal(true)}><Plus size={14} /> Novo título</Button>
                </div>
                {selectedRec.size > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                    <span className="text-[13px] font-medium text-accent-ink">{selectedRec.size} selecionado{selectedRec.size !== 1 ? 's' : ''}</span>
                    <span className="flex-1" />
                    <Button variant="danger" className="bg-danger border-danger text-white hover:opacity-90" onClick={() => bulkDeleteRecMut.mutate([...selectedRec])}><Trash2 size={14} /> Remover selecionados</Button>
                  </div>
                )}
                <Table columns={recColumns} data={recTab} keyField="id" onRowClick={r => navigate(`/receivables/${r.id}`)} emptyMessage="Nenhum título encontrado." />
                <Pagination page={tabPages.receber} totalPages={receivablesTabData?.totalPages ?? 1} total={receivablesTabData?.total ?? 0} limit={PAGE_SIZE} onChange={p => { setTabPage('receber', p); setSelectedRec(new Set()); }} />
              </div>
            )}
            {alunoTab === 'pagar' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
                  <div className="px-0.5 flex items-center">
                    <Checkbox checked={allSelectedPagar} onChange={toggleAllPagar} />
                  </div>
                </div>
                {selectedPagar.size > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                    <span className="text-[13px] font-medium text-accent-ink">{selectedPagar.size} selecionado{selectedPagar.size !== 1 ? 's' : ''}</span>
                    <span className="flex-1" />
                    <Button variant="danger" className="bg-danger border-danger text-white hover:opacity-90" onClick={() => bulkDeletePayableMut.mutate([...selectedPagar])}><Trash2 size={14} /> Remover selecionados</Button>
                  </div>
                )}
                <Table columns={payColumns} data={pagarTab} keyField="id" onRowClick={p => navigate(`/payables/${p.id}`)} emptyMessage="Nenhum título a pagar encontrado." />
                <Pagination page={tabPages.pagar} totalPages={payablesData?.totalPages ?? 1} total={payablesData?.total ?? 0} limit={PAGE_SIZE} onChange={p => { setTabPage('pagar', p); setSelectedPagar(new Set()); }} />
              </div>
            )}
            {alunoTab === 'faturas' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
                  <div className="px-0.5 flex items-center">
                    <Checkbox checked={allSelectedFatura} onChange={toggleAllFatura} />
                  </div>
                  <div className="flex-1" />
                  <Button variant="primary" onClick={() => setNewFaturaModal(true)}><Plus size={14} /> Nova fatura</Button>
                </div>
                {selectedFatura.size > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                    <span className="text-[13px] font-medium text-accent-ink">{selectedFatura.size} selecionado{selectedFatura.size !== 1 ? 's' : ''}</span>
                    <span className="flex-1" />
                    <Button variant="danger" className="bg-danger border-danger text-white hover:opacity-90" onClick={() => bulkDeleteFaturaMut.mutate([...selectedFatura])}><Trash2 size={14} /> Remover selecionados</Button>
                  </div>
                )}
                <Table columns={faturaColumns} data={faturasTab} keyField="id" onRowClick={b => navigate(`/invoices/${b.id}`)} emptyMessage="Nenhuma fatura encontrada." />
                <Pagination page={tabPages.faturas} totalPages={billsResponse?.totalPages ?? 1} total={billsResponse?.total ?? 0} limit={PAGE_SIZE} onChange={p => { setTabPage('faturas', p); setSelectedFatura(new Set()); }} />
              </div>
            )}


          </div>
        )}

        {/* ── ALUNO ── */}
        {activeRoleTab === 'student' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-elev border border-line rounded-lg text-[13px] w-fit mb-3">
                <Calendar size={14} className="text-ink-3 shrink-0" />
                <span className="text-ink-3 font-medium">Aluno desde</span>
                <span className="font-semibold text-ink">{people?.students?.created_at ? formatDate(people.students.created_at) : '—'}</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Voos</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><PlaneIcon size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Voos</div>
                    <div className="text-[20px] font-bold tracking-tight">{studentFlightStats?.total ?? 0}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Timer size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Horas de voo</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono">{formatHours(studentFlightStats?.total_hours ?? 0)}</div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mt-1">Financeiro</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Recebido</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-success"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalRecebido)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Clock size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">A receber</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAberto)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><ArrowUpRight size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Pago</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-danger"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalPago)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Hourglass size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">A pagar</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAPagar)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-b border-line">
              {[
                { key: 'voos', label: 'Voos' },
                { key: 'receber', label: 'Títulos a receber' },
                { key: 'pagar', label: 'Títulos a pagar' },
              ].map(t => (
                <button key={t.key}
                  className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 -mb-px whitespace-nowrap ${alunoSubTab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                  style={{ borderBottomColor: alunoSubTab === t.key ? 'var(--accent)' : 'transparent' }}
                  onClick={() => setAlunoSubTab(t.key)}
                >{t.label}</button>
              ))}
            </div>

            {alunoSubTab === 'voos' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
                  <div className="px-0.5 flex items-center">
                    <Checkbox checked={allSelectedVoo} onChange={toggleAllVoo} />
                  </div>
                  <div className="flex-1" />
                  <Button variant="primary" onClick={() => setNewVooModal('student')}><Plus size={14} /> Novo voo</Button>
                </div>
                {selectedVoo.size > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                    <span className="text-[13px] font-medium text-accent-ink">{selectedVoo.size} selecionado{selectedVoo.size !== 1 ? 's' : ''}</span>
                    <span className="flex-1" />
                    <Button variant="danger" className="bg-danger border-danger text-white hover:opacity-90" onClick={() => bulkDeleteVooMut.mutate([...selectedVoo])}><Trash2 size={14} /> Remover selecionados</Button>
                  </div>
                )}
                <Table columns={vooColumns} data={voosTab} keyField="id" emptyMessage="Nenhum voo encontrado." />
                <Pagination page={tabPages.voos} totalPages={flightsStudentData?.totalPages ?? 1} total={flightsStudentData?.total ?? 0} limit={PAGE_SIZE} onChange={p => { setTabPage('voos', p); setSelectedVoo(new Set()); }} />
              </div>
            )}

            {alunoSubTab === 'receber' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <Table columns={recColumnsBasic} data={recTab} keyField="id" onRowClick={r => navigate(`/receivables/${r.id}`)} emptyMessage="Nenhum título encontrado." />
                <Pagination page={tabPages.receber} totalPages={receivablesTabData?.totalPages ?? 1} total={receivablesTabData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('receber', p)} />
              </div>
            )}

            {alunoSubTab === 'pagar' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <Table columns={payColumnsBasic} data={pagarTab} keyField="id" onRowClick={p => navigate(`/payables/${p.id}`)} emptyMessage="Nenhum título encontrado." />
                <Pagination page={tabPages.pagar} totalPages={payablesData?.totalPages ?? 1} total={payablesData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('pagar', p)} />
              </div>
            )}
          </div>
        )}

        {/* ── SÓCIO ── */}
        {activeRoleTab === 'partner' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-elev border border-line rounded-lg text-[13px] w-fit mb-3">
                <Calendar size={14} className="text-ink-3 shrink-0" />
                <span className="text-ink-3 font-medium">Sócio desde</span>
                <span className="font-semibold text-ink">{people?.partners?.created_at ? formatDate(people.partners.created_at) : '—'}</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Mensalidades</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Calendar size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Quantidade de mensalidade</div>
                    <div className="text-[20px] font-bold tracking-tight">{mensalidadeRecs.length}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><BarChart3 size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Valor total das mensalidades</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(mensalidadesTotal)}</div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mt-1">Voos</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><PlaneIcon size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Voos</div>
                    <div className="text-[20px] font-bold tracking-tight">{partnerFlightStats?.total ?? 0}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Timer size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Horas de voo</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono">{formatHours(partnerFlightStats?.total_hours ?? 0)}</div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mt-1">Financeiro</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Recebido</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-success"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalRecebido)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Clock size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">A receber</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAberto)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><ArrowUpRight size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Pago</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-danger"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalPago)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Hourglass size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">A pagar</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAPagar)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-b border-line">
              {[
                { key: 'voos', label: 'Voos' },
                { key: 'receber', label: 'Títulos a receber' },
                { key: 'pagar', label: 'Títulos a pagar' },
              ].map(t => (
                <button key={t.key}
                  className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 -mb-px whitespace-nowrap ${socioSubTab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                  style={{ borderBottomColor: socioSubTab === t.key ? 'var(--accent)' : 'transparent' }}
                  onClick={() => setSocioSubTab(t.key)}
                >{t.label}</button>
              ))}
            </div>

            {socioSubTab === 'voos' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
                  <div className="flex-1" />
                  <Button variant="primary" onClick={() => setNewVooModal('partner')}><Plus size={14} /> Novo voo</Button>
                </div>
                <Table columns={vooColumnsBasic} data={voosSocioTab} keyField="id" emptyMessage="Nenhum voo encontrado." />
                <Pagination page={tabPages.voos_socio} totalPages={flightsPartnerData?.totalPages ?? 1} total={flightsPartnerData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('voos_socio', p)} />
              </div>
            )}

            {socioSubTab === 'receber' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <Table columns={recColumnsBasic} data={recTab} keyField="id" onRowClick={r => navigate(`/receivables/${r.id}`)} emptyMessage="Nenhum título encontrado." />
                <Pagination page={tabPages.receber} totalPages={receivablesTabData?.totalPages ?? 1} total={receivablesTabData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('receber', p)} />
              </div>
            )}

            {socioSubTab === 'pagar' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <Table columns={payColumnsBasic} data={pagarTab} keyField="id" onRowClick={p => navigate(`/payables/${p.id}`)} emptyMessage="Nenhum título encontrado." />
                <Pagination page={tabPages.pagar} totalPages={payablesData?.totalPages ?? 1} total={payablesData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('pagar', p)} />
              </div>
            )}
          </div>
        )}

        {/* ── INSTRUTOR ── */}
        {activeRoleTab === 'instructor' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-elev border border-line rounded-lg text-[13px] w-fit mb-3">
                <Calendar size={14} className="text-ink-3 shrink-0" />
                <span className="text-ink-3 font-medium">Instrutor desde</span>
                <span className="font-semibold text-ink">{people?.instructors?.created_at ? formatDate(people.instructors.created_at) : '—'}</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Voos</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><PlaneIcon size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Voos instruídos</div>
                    <div className="text-[20px] font-bold tracking-tight">{instructorFlights.length}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Timer size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Horas instruídas</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono">{formatHours(instrHours)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><BarChart3 size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Total de comissões</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(instrComissoesTotal)}</div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mt-1">Financeiro</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Recebido</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-success"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalRecebido)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Clock size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">A receber</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAberto)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><ArrowUpRight size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Pago</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-danger"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalPago)}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Hourglass size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">A pagar</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAPagar)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-b border-line">
              {[
                { key: 'voos_instrutor', label: 'Voos instruídos' },
                { key: 'titulos_instrutor', label: 'Títulos instrutor' },
              ].map(t => (
                <button key={t.key}
                  className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 -mb-px whitespace-nowrap ${instrTab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                  style={{ borderBottomColor: instrTab === t.key ? 'var(--accent)' : 'transparent' }}
                  onClick={() => setInstrTab(t.key)}
                >{t.label}</button>
              ))}
            </div>
            {instrTab === 'voos_instrutor' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <Table columns={instrVooColumns} data={instrVoosTab} keyField="id" emptyMessage="Nenhum voo instruído encontrado." />
                <Pagination page={tabPages.voos_instrutor} totalPages={instructorFlightsData?.totalPages ?? 1} total={instructorFlightsData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('voos_instrutor', p)} />
              </div>
            )}
            {instrTab === 'titulos_instrutor' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <Table columns={payColumnsWithTitle} data={instrPayTab} keyField="id" onRowClick={(p: any) => navigate(`/payables/${p.id}`)} emptyMessage="Nenhum título encontrado." />
                <Pagination page={tabPages.titulos_instrutor} totalPages={instructorPayablesData?.totalPages ?? 1} total={instructorPayablesData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('titulos_instrutor', p)} />
              </div>
            )}
          </div>
        )}

        {/* ── FUNCIONÁRIO ── */}
        {activeRoleTab === 'employee' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-elev border border-line rounded-lg text-[13px] w-fit mb-3">
              <Calendar size={14} className="text-ink-3 shrink-0" />
              <span className="text-ink-3 font-medium">Funcionário desde</span>
              <span className="font-semibold text-ink">{people?.employees?.created_at ? formatDate(people.employees.created_at) : '—'}</span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Financeiro</div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[12px] text-ink-3 font-medium">Recebido</div>
                  <div className="text-[20px] font-bold tracking-tight font-mono text-success"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalRecebido)}</div>
                </div>
              </div>
              <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Clock size={18} /></div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[12px] text-ink-3 font-medium">A receber</div>
                  <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(totalAberto)}</div>
                </div>
              </div>
              <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><ArrowUpRight size={18} /></div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[12px] text-ink-3 font-medium">Pago</div>
                  <div className="text-[20px] font-bold tracking-tight font-mono text-danger"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(empPago)}</div>
                </div>
              </div>
              <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Hourglass size={18} /></div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[12px] text-ink-3 font-medium">A pagar</div>
                  <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(empAPagar)}</div>
                </div>
              </div>
            </div>
            </div>
            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <Table columns={payColumnsWithTitle} data={empPayTab} keyField="id" onRowClick={(p: any) => navigate(`/payables/${p.id}`)} emptyMessage="Nenhum título encontrado." />
              <Pagination page={tabPages.func_pagar} totalPages={employeePayablesData?.totalPages ?? 1} total={employeePayablesData?.total ?? 0} limit={PAGE_SIZE} onChange={p => setTabPage('func_pagar', p)} />
            </div>
          </div>
        )}
      </div>

      {tituloMenu && menuTitulo && (
        <RowMenu top={tituloMenu.top} right={tituloMenu.right} onClose={() => setTituloMenu(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/receivables/${menuTitulo.id}`)}>Ver detalhes</RowMenuItem>
          <RowMenuItem icon={<Edit size={14} />} onClick={() => setEditTitulo(menuTitulo)}>Editar</RowMenuItem>
          {receivableStatus(menuTitulo) !== 'paid' && <RowMenuItem icon={<Check size={14} />} onClick={() => setSettleTitulo(menuTitulo)}>Receber</RowMenuItem>}
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteTituloMut.mutate(menuTitulo.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      )}

      {vooMenu && menuVoo && (
        <RowMenu top={vooMenu.top} right={vooMenu.right} onClose={() => setVooMenu(null)}>
          {!menuVoo.end_date && <RowMenuItem icon={<Check size={14} />} onClick={() => { setVooMenu(null); setCloseVoo(menuVoo); }}>Encerrar voo</RowMenuItem>}
          <RowMenuItem icon={<Edit size={14} />} onClick={() => setEditVoo(menuVoo)}>Editar</RowMenuItem>
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteVooMut.mutate(menuVoo.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      )}

      {faturaMenu && menuFatura && (
        <RowMenu top={faturaMenu.top} right={faturaMenu.right} onClose={() => setFaturaMenu(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/invoices/${menuFatura.id}`)}>Ver detalhes</RowMenuItem>
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteFaturaMut.mutate(menuFatura.id)}>Estornar</RowMenuDangerItem>
        </RowMenu>
      )}

      {payableMenu && menuPayable && (
        <RowMenu top={payableMenu.top} right={payableMenu.right} onClose={() => setPayableMenu(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/payables/${menuPayable.id}`)}>Ver detalhes</RowMenuItem>
          {menuPayable.status !== 'PAID' && <RowMenuItem icon={<Check size={14} />} onClick={() => { setPayableMenu(null); setPayPayable(menuPayable); }}>Pagar</RowMenuItem>}
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deletePayableMut.mutate(menuPayable.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      )}

      {creditModal && <NewCreditModal personId={peopleId} onClose={() => setCreditModal(false)} onSuccess={() => setCreditModal(false)} />}
      {newTituloModal && <NewTituloModal personId={peopleId} onClose={() => setNewTituloModal(false)} onSave={d => createTituloMut.mutate(d)} />}
      {editTitulo && <EditTituloModal rec={editTitulo} onClose={() => setEditTitulo(null)} onSave={d => updateTituloMut.mutate({ id: editTitulo.id, data: d })} />}
      {settleTitulo && <SettleTituloModal rec={settleTitulo} creditBalance={creditBalance} onClose={() => setSettleTitulo(null)} onSave={d => settleMut.mutate({ id: settleTitulo.id, data: d as Parameters<typeof registerPayment>[1] })} />}

      {newVooModal && <FlightModal mode="new" planes={planes} initialCustomerId={peopleId} initialStudentId={newVooModal === 'student' ? studentId : undefined} initialPartnerId={newVooModal === 'partner' ? partnerId : undefined} onClose={() => setNewVooModal(null)} onSave={d => createVooMut.mutate(d)} />}
      {editVoo && <FlightModal mode="edit" flight={editVoo} planes={planes} onClose={() => setEditVoo(null)} onSave={(data) => updateVooMut.mutate({ id: editVoo.id, data })} />}
      {closeVoo && <CloseFlightModal flight={closeVoo} onClose={() => setCloseVoo(null)} onSave={end_date => closeVooMut.mutate({ id: closeVoo.id, end_date })} />}

      {newFaturaModal && <NewFaturaModal receivables={receivables} personId={peopleId} onClose={() => setNewFaturaModal(false)} onSave={d => createFaturaMut.mutate(d)} />}

      {payPayable && <PayModal payable={payPayable} onClose={() => setPayPayable(null)} onSave={d => payMut.mutate(d)} />}
      {editPeopleModal && <PeopleModal mode="edit" people={people} onClose={() => setEditPeopleModal(false)} onSave={data => updatePeopleMut.mutate(data)} />}

    </div>
  );
}
