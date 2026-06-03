import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Check, X, Edit, Trash2, MoreHorizontal, Eye, ChevronRight, Plane as PlaneIcon, Timer, TrendingUp, ArrowDownLeft, Clock, ArrowUpRight, Hourglass, BarChart3, Calendar } from 'lucide-react';
import { getCustomer, getCustomerCredits, getCustomers, updateCustomer } from '../../api/customers';
import { createReceivable, updateReceivable, deleteReceivable, registerPayment } from '../../api/receivables';
import { getPayables, deletePayable, registerPayablePayment } from '../../api/payables';
import { getFlights, createFlight, updateFlight, closeFlight, deleteFlight } from '../../api/flights';
import { createBill, deleteBill, getBillsByCustomer } from '../../api/invoices';
import { getPlanes } from '../../api/planes';
import DateInput from '../../components/DateInput';
import PayModal from '../../components/PayModal';
import { formatBRL, formatDate, formatDateTime, formatHours, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import FlightModal from '../flights/FlightModal';
import CloseFlightModal from '../flights/CloseFlightModal';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';
import Checkbox from '../../components/ui/Checkbox';
import type { Receivable, Flight, Bill, Payable } from '../../types';
import CustomerModal from './CustomerModal';
import { toast, extractErrorMessage } from '../../utils/toast';

type MenuState = { id: number; top: number; right: number };
type BadgeVariant = 'success' | 'warn' | 'danger' | 'accent' | 'default';
type ChipVariant = 'aluno' | 'socio' | 'instrutor' | 'funcionario' | 'default';

const P_STATUS_LABEL: Record<string, string> = { open: 'A pagar', partial: 'Parcial', closed: 'Pago' };
const P_STATUS_BADGE: Record<string, string> = { open: 'warn', partial: 'accent', closed: 'success' };

const inputCls = 'w-full px-3 py-1.5 text-[13px] bg-bg border border-line rounded-md text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100 placeholder:text-ink-3';
const textareaCls = 'w-full px-3 py-2 text-[13px] bg-bg border border-line rounded-md text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100 resize-y min-h-[80px]';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';
const btnDanger = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-danger border border-danger text-white cursor-pointer hover:opacity-90';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';
const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';
const rowMenuBtn = 'w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left';
const rowMenuBtnDanger = 'w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left';


function NewCreditModal({ customerId, onClose, onSuccess }: { customerId: number; onClose: () => void; onSuccess: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ title: '', description: '', expiration_date: '', amount: '' });

  const step1Valid = parseFloat(form.amount) > 0;
  const step2Valid = form.title.trim() !== '';

  const mut = useMutation({
    mutationFn: () => createReceivable({
      client_id: customerId,
      payer_type: 'customer',
      title: form.title,
      product: 'credito',
      total_amount: parseFloat(form.amount),
      ...(form.description && { description: form.description }),
      ...(form.expiration_date && { expiration_date: form.expiration_date }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', customerId] });
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
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {step === 1 && (
          <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor do crédito</label>
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
              <label className="text-[12px] font-medium text-ink-2">Título</label>
              <input autoFocus className={inputCls} placeholder="Ex.: Crédito de cortesia" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Descrição do título <span className="text-ink-3 font-normal">(opcional)</span></label>
              <input className={inputCls} placeholder="Detalhes adicionais…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Data de vencimento <span className="text-ink-3 font-normal">(opcional)</span></label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <button className={btnCancel} onClick={step === 1 ? onClose : () => setStep(1)}>
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          {step === 1 ? (
            <button className={btnPrimary} disabled={!step1Valid} onClick={() => setStep(2)}>
              Próximo <ChevronRight size={14} />
            </button>
          ) : (
            <button className={btnPrimary} disabled={!step2Valid || mut.isPending} onClick={() => mut.mutate()}>
              <Check size={14} /> {mut.isPending ? 'Salvando…' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewTituloModal({ customerId, onClose, onSave, defaultProduct = 'voo' }: { customerId: number; onClose: () => void; onSave: (d: unknown) => void; defaultProduct?: string }) {
  const [form, setForm] = useState({ title: '', product: defaultProduct, expiration_date: '', total_amount: '', plane_id: '', flight_id: '' });
  const { data: planesData } = useQuery({ queryKey: ['planes-all'], queryFn: () => getPlanes(1, 100) });
  const planes = planesData?.data ?? [];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">Novo título a receber</h3>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Descrição do título</label>
            <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Tipo</label>
              <select className={inputCls} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
                <option value="voo">Voo</option>
                <option value="mensalidade">Mensalidade</option>
                <option value="servico">Serviço</option>
                <option value="credito">Crédito</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Aeronave <span className="text-ink-3 font-normal">(opcional)</span></label>
              <select className={inputCls} value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
                <option value="">—</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Voo Nº <span className="text-ink-3 font-normal">(opcional)</span></label>
              <input type="number" className={inputCls} placeholder="ID do voo" value={form.flight_id} onChange={e => setForm(f => ({ ...f, flight_id: e.target.value }))} />
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
          <button className={btnCancel} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} onClick={() => onSave({
            client_id: customerId,
            title: form.title,
            product: form.product,
            expiration_date: form.expiration_date || undefined,
            total_amount: parseFloat(form.total_amount),
            payer_type: 'customer',
            ...(form.plane_id && { plane_id: parseInt(form.plane_id) }),
            ...(form.flight_id && { flight_id: parseInt(form.flight_id) }),
          })}>
            <Check size={14} /> Criar título
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTituloModal({ rec, onClose, onSave }: { rec: Receivable; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: rec.title, expiration_date: rec.expiration_date?.slice(0, 10) ?? '', total_amount: String(rec.total_amount) });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold m-0">Editar título</h3>
            <div className="text-[11.5px] text-ink-3 mt-0.5">{rec.id}</div>
          </div>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Descrição</label>
            <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor</label>
              <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg border-r border-line select-none">R$</span>
                <input type="number" step="0.01" className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <button className={btnCancel} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} onClick={() => onSave({ title: form.title, expiration_date: form.expiration_date || undefined, total_amount: parseFloat(form.total_amount) })}><Check size={14} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

function SettleTituloModal({ rec, creditBalance = 0, onClose, onSave }: { rec: Receivable; creditBalance?: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const remaining = Number(rec.total_amount) - Number(rec.amount_received);
  const [mode, setMode] = useState<'total' | 'partial'>('total');
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('PIX');
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
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
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
                  <select className={inputCls} value={method} onChange={e => setMethod(e.target.value)}>
                    <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Cheque</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <span className="text-[11.5px] text-ink-3 mr-auto">Saldo restante: <strong className="font-mono">R$ {formatBRL(Math.max(0, remaining - totalEffective))}</strong></span>
          <button className={btnCancel} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} onClick={() => onSave({ amount_received: effectiveCash, payment_method: method, payment_date: new Date().toISOString(), use_credit: useCredit })}><Check size={14} /> Confirmar recebimento</button>
        </div>
      </div>
    </div>
  );
}

function NewFaturaModal({ receivables, customerId, onClose, onSave }: { receivables: Receivable[]; customerId: number; onClose: () => void; onSave: (d: { customer_id: number; items: { receivable_id: number; amount: number }[]; payment_method?: string; due_date?: string }) => void }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [method, setMethod] = useState('PIX');
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
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="px-[18px] py-3.5 border-b border-line">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
                <select className={inputCls} value={method} onChange={e => setMethod(e.target.value)}>
                  <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Cheque</option>
                </select>
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
          <button className={btnCancel} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} disabled={Object.keys(selected).length === 0 || total <= 0}
            onClick={() => onSave({ customer_id: customerId, payment_method: method, ...(dueDate && { due_date: dueDate }), items: Object.entries(selected).map(([id, amount]) => ({ receivable_id: Number(id), amount })) })}>
            <Check size={14} /> Gerar fatura
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const customerId = Number(id);

  const { data: customer, isLoading } = useQuery({ queryKey: ['customer', customerId], queryFn: () => getCustomer(customerId) });
  const { data: credits } = useQuery({ queryKey: ['credits', customerId], queryFn: () => getCustomerCredits(customerId) });
  const { data: billsResponse } = useQuery({ queryKey: ['bills', customerId], queryFn: () => getBillsByCustomer(customerId) });
  const bills = billsResponse?.data ?? [];
  const { data: planesResponse } = useQuery({ queryKey: ['planes'], queryFn: getPlanes });
  const planes = planesResponse?.data ?? [];
  const { data: allCustomersResponse } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() });
  const allCustomers = allCustomersResponse?.data ?? [];
  const { data: payablesData } = useQuery({
    queryKey: ['payables', 'customer', customerId],
    queryFn: () => getPayables(undefined, 1, 999, customerId),
  });
  const customerPayables = payablesData?.data ?? [];

  const instructorId = customer?.instructors?.[0]?.id;
  const { data: instructorFlightsData } = useQuery({
    queryKey: ['flights', 'instructor', instructorId],
    queryFn: () => getFlights(1, 9999, undefined, undefined, undefined, undefined, undefined, undefined, instructorId),
    enabled: !!instructorId && customer?.categories?.includes('instrutor'),
  });
  const instructorFlights = instructorFlightsData?.data ?? [];

  const { data: instructorPayablesData } = useQuery({
    queryKey: ['payables', 'instructor', instructorId],
    queryFn: () => getPayables(undefined, 1, 9999, undefined, undefined, undefined, undefined, instructorId),
    enabled: !!instructorId && customer?.categories?.includes('instrutor'),
  });
  const instructorPayables = instructorPayablesData?.data ?? [];

  const employeeId = customer?.employees?.[0]?.id;
  const { data: employeePayablesData } = useQuery({
    queryKey: ['payables', 'employee', employeeId],
    queryFn: () => getPayables(undefined, 1, 9999, undefined, undefined, undefined, undefined, undefined, employeeId),
    enabled: !!employeeId && customer?.categories?.includes('funcionario'),
  });
  const employeePayables = employeePayablesData?.data ?? [];

  const [roleTab, setRoleTab] = useState('cliente');
  const [alunoTab, setAlunoTab] = useState('receber');
  const [instrTab, setInstrTab] = useState('voos_instrutor');

  const [tituloMenu, setTituloMenu] = useState<MenuState | null>(null);
  const [vooMenu, setVooMenu] = useState<MenuState | null>(null);
  const [faturaMenu, setFaturaMenu] = useState<MenuState | null>(null);
  const [payableMenu, setPayableMenu] = useState<MenuState | null>(null);

  const [creditModal, setCreditModal] = useState(false);
  const [newTituloModal, setNewTituloModal] = useState(false);
  const [newVooModal, setNewVooModal] = useState(false);
  const [newFaturaModal, setNewFaturaModal] = useState(false);

  const [editTitulo, setEditTitulo] = useState<Receivable | null>(null);
  const [settleTitulo, setSettleTitulo] = useState<Receivable | null>(null);
  const [editVoo, setEditVoo] = useState<Flight | null>(null);
  const [closeVoo, setCloseVoo] = useState<Flight | null>(null);
  const [payPayable, setPayPayable] = useState<Payable | null>(null);
  const [editCustomerModal, setEditCustomerModal] = useState(false);

  const PAGE_SIZE = 10;
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tabPages, setTabPages] = useState<Record<string, number>>({ voos: 1, receber: 1, pagar: 1, faturas: 1, creditos: 1, mensalidades: 1, voos_instrutor: 1, titulos_instrutor: 1, func_pagar: 1 });
  const setTabPage = (t: string, page: number) => setTabPages(p => ({ ...p, [t]: page }));

  const [selectedRec, setSelectedRec] = useState<Set<number>>(new Set());
  const [selectedVoo, setSelectedVoo] = useState<Set<number>>(new Set());
  const [selectedFatura, setSelectedFatura] = useState<Set<number>>(new Set());
  const [selectedPagar, setSelectedPagar] = useState<Set<number>>(new Set());

  const updateCustomerMut = useMutation({
    mutationFn: (data: unknown) => updateCustomer(customerId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); setEditCustomerModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const createTituloMut = useMutation({
    mutationFn: createReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setNewTituloModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateTituloMut = useMutation({
    mutationFn: ({ id: rid, data }: { id: number; data: unknown }) => updateReceivable(rid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setEditTitulo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteTituloMut = useMutation({
    mutationFn: deleteReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteRecMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deleteReceivable)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelectedRec(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const settleMut = useMutation({
    mutationFn: ({ id: rid, data }: { id: number; data: Parameters<typeof registerPayment>[1] }) => registerPayment(rid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); qc.invalidateQueries({ queryKey: ['credits', customerId] }); setSettleTitulo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const createVooMut = useMutation({
    mutationFn: createFlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setNewVooModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateVooMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updateFlight(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setEditVoo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const closeVooMut = useMutation({
    mutationFn: ({ id: fid, end_date }: { id: number; end_date: string }) => closeFlight(fid, end_date),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setCloseVoo(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteVooMut = useMutation({
    mutationFn: deleteFlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteVooMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deleteFlight)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setSelectedVoo(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const createFaturaMut = useMutation({
    mutationFn: createBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', customerId] }); qc.invalidateQueries({ queryKey: ['customer', customerId] }); setNewFaturaModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteFaturaMut = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', customerId] }); qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteFaturaMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deleteBill)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', customerId] }); qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelectedFatura(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const deletePayableMut = useMutation({
    mutationFn: deletePayable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payables', 'customer', customerId] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeletePayableMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deletePayable)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables', 'customer', customerId] }); setSelectedPagar(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const payMut = useMutation({
    mutationFn: (d: unknown) => registerPayablePayment(payPayable!.id, d as { amount: number; method?: string; paid_at?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables', 'customer', customerId] }); setPayPayable(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) return <div className="p-8 text-[13px] text-ink-3">Carregando…</div>;
  if (!customer) return <div className="p-8 text-[13px] text-ink-3">Pessoa não encontrada.</div>;

  const receivables = customer.receivables ?? [];
  const payerReceivables = receivables.filter(r => r.payer_type === 'customer' || r.payer_type == null);
  const ownPayables = customerPayables.filter(p => p.payer_type === 'customer' || p.payer_type == null);
  const flights = customer.flights ?? [];

  const menuTitulo = tituloMenu ? receivables.find(r => r.id === tituloMenu.id) ?? null : null;
  const menuVoo = vooMenu ? flights.find(f => f.id === vooMenu.id) ?? null : null;
  const menuFatura = faturaMenu ? bills.find(b => b.id === faturaMenu.id) ?? null : null;
  const menuPayable = payableMenu ? customerPayables.find(p => p.id === payableMenu.id) ?? null : null;

  function openMenu(setter: (s: MenuState | null) => void, id: number, e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setter(s => s?.id === id ? null : { id, top: r.bottom + 4, right: window.innerWidth - r.right });
  }

  const allIdsRec = payerReceivables.map(r => r.id);
  const allSelectedRec = allIdsRec.length > 0 && allIdsRec.every(id => selectedRec.has(id));
  function toggleAllRec() { setSelectedRec(allSelectedRec ? new Set() : new Set(allIdsRec)); }
  function toggleOneRec(id: number) { setSelectedRec(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const allIdsVoo = flights.map(f => f.id);
  const allSelectedVoo = allIdsVoo.length > 0 && allIdsVoo.every(id => selectedVoo.has(id));
  function toggleAllVoo() { setSelectedVoo(allSelectedVoo ? new Set() : new Set(allIdsVoo)); }
  function toggleOneVoo(id: number) { setSelectedVoo(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const allIdsFatura = bills.map(b => b.id);
  const allSelectedFatura = allIdsFatura.length > 0 && allIdsFatura.every(id => selectedFatura.has(id));
  function toggleAllFatura() { setSelectedFatura(allSelectedFatura ? new Set() : new Set(allIdsFatura)); }
  function toggleOneFatura(id: number) { setSelectedFatura(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const allIdsPagar = ownPayables.map(p => p.id);
  const allSelectedPagar = allIdsPagar.length > 0 && allIdsPagar.every(id => selectedPagar.has(id));
  function toggleAllPagar() { setSelectedPagar(allSelectedPagar ? new Set() : new Set(allIdsPagar)); }
  function toggleOnePagar(id: number) { setSelectedPagar(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const totalAberto = payerReceivables.reduce((s, r) => s + Math.max(0, Number(r.total_amount) - Number(r.amount_received)), 0);
  const totalRecebido = payerReceivables.reduce((s, r) => s + Number(r.amount_received), 0);
  const totalAPagar = customerPayables.reduce((s, p) => s + Math.max(0, Number(p.amount) - Number(p.amount_paid)), 0);
  const totalPago = customerPayables.reduce((s, p) => s + Number(p.amount_paid), 0);
  const creditBalance = credits?.flight_hour_balance ?? 0;

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

  const filteredVoos = filterDate(flights, 'start_date');
  const voosResult = pageItems(filteredVoos, tabPages.voos);
  const filteredRec = filterDate(payerReceivables, 'expiration_date');
  const recResult = pageItems(filteredRec, tabPages.receber);
  const filteredPagar = filterDate(ownPayables, 'due_date');
  const pagarResult = pageItems(filteredPagar, tabPages.pagar);
  const filteredFaturas = filterDate(bills, 'issue_date');
  const faturasResult = pageItems(filteredFaturas, tabPages.faturas);
  const movements = credits?.movements ?? [];
  const filteredCreditos = filterDate(movements as any[], 'payment_date');
  const creditosResult = pageItems(filteredCreditos, tabPages.creditos);

  const isAluno = customer.categories.includes('aluno');
  const isInstructor = customer.categories.includes('instrutor');
  const isPartner = customer.categories.includes('socio');
  const isEmployee = customer.categories.includes('funcionario');

  const mensalidadeRecs = payerReceivables.filter(r => r.product === 'mensalidade');
  const mensalidadesTotal = mensalidadeRecs.reduce((s, r) => s + Number(r.total_amount), 0);
  const mensalidadesRecebidas = mensalidadeRecs.reduce((s, r) => s + Number(r.amount_received), 0);
  const mensalidadesPendentes = Math.max(0, mensalidadesTotal - mensalidadesRecebidas);

  const empAPagar = employeePayables.reduce((s, p) => s + Math.max(0, Number(p.amount) - Number(p.amount_paid)), 0);
  const empPago = employeePayables.reduce((s, p) => s + Number(p.amount_paid), 0);
  const remuneracaoRecebida = instructorPayables.reduce((s, p) => s + Number(p.amount_paid), 0);
  const remuneracaoAReceber = instructorPayables.reduce((s, p) => s + Math.max(0, Number(p.amount) - Number(p.amount_paid)), 0);
  const instrHours = instructorFlights.reduce((s, f) => s + Number(f.total_hours ?? 0), 0);
  const instrReceita = instructorFlights.reduce((s, f) => s + Number(f.total_amount ?? 0), 0);
  const instrComissoesTotal = instructorPayables.reduce((s, p) => s + Number(p.amount), 0);

  const instrVoosResult = pageItems(instructorFlights, tabPages['voos_instrutor'] ?? 1);
  const instrPayResult = pageItems(instructorPayables, tabPages['titulos_instrutor'] ?? 1);
  const mensalidadesResult = pageItems(mensalidadeRecs, tabPages['mensalidades'] ?? 1);
  const empPayResult = pageItems(employeePayables, tabPages['func_pagar'] ?? 1);

  const ROLE_TABS = [
    { key: 'cliente', label: 'Cliente' },
    ...(isAluno ? [{ key: 'aluno', label: 'Aluno' }] : []),
    ...(isPartner ? [{ key: 'socio', label: 'Sócio' }] : []),
    ...(isInstructor ? [{ key: 'instrutor', label: 'Instrutor' }] : []),
    ...(isEmployee ? [{ key: 'funcionario', label: 'Funcionário' }] : []),
  ];
  const activeRoleTab = ROLE_TABS.find(t => t.key === roleTab)?.key ?? ROLE_TABS[0].key;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/pessoas')}><ChevronLeft size={15} /> Voltar</button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{customer.name}</h1>
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {customer.categories.map(cat => (
              <Chip key={cat} variant={cat as ChipVariant}>
                {cat === 'socio' ? 'sócio' : cat}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[12px] text-ink-3 font-mono">{customer.cpf} · {customer.email}</span>
            {customer.phone_number && <span className="text-[12px] text-ink-3">· {customer.phone_number}</span>}
          </div>
          {customer.address && (
            <div className="text-[12px] text-ink-3 mt-2">
              {[
                customer.address,
                customer.neighborhood,
                customer.city && customer.state ? `${customer.city} - ${customer.state}` : (customer.city || customer.state),
                customer.zip_code,
              ].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-6">
          <button className={btnCancel} onClick={() => setEditCustomerModal(true)}><Edit size={14} /> Editar</button>
        </div>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg px-5 py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Créditos disponíveis</div>
          <div className="font-mono text-[24px] font-bold tracking-tight">
            <span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(creditBalance)}
          </div>
        </div>
        <button className={btnPrimary} onClick={() => setCreditModal(true)}><Plus size={14} /> Adicionar crédito</button>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-5">
        <div className="flex items-center gap-3 justify-end">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
          <button className={btnPrimary} onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); }}>Aplicar</button>
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

        {/* ── CLIENTE ── */}
        {activeRoleTab === 'cliente' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Títulos</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4">
                  <div className="text-[12px] text-ink-3 font-medium mb-1">Valor a receber</div>
                  <div className="text-[22px] font-bold tracking-tight font-mono"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(totalAberto)}</div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4">
                  <div className="text-[12px] text-ink-3 font-medium mb-1">Valor recebido</div>
                  <div className="text-[22px] font-bold tracking-tight font-mono"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(totalRecebido)}</div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4">
                  <div className="text-[12px] text-ink-3 font-medium mb-1">Valor a pagar</div>
                  <div className="text-[22px] font-bold tracking-tight font-mono"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(totalAPagar)}</div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4">
                  <div className="text-[12px] text-ink-3 font-medium mb-1">Valor pago</div>
                  <div className="text-[22px] font-bold tracking-tight font-mono"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(totalPago)}</div>
                </div>
              </div>
            </div>
            <div className="flex border-b border-line">
              {[
                { key: 'receber', label: 'Títulos a receber' },
                { key: 'pagar', label: 'Títulos a pagar' },
                { key: 'faturas', label: 'Faturas' },
                { key: 'creditos', label: 'Créditos' },
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
                <div className="flex items-center justify-end px-3 py-2.5 border-b border-line">
                  <button className={btnPrimary} onClick={() => setNewTituloModal(true)}><Plus size={14} /> Novo título</button>
                </div>
                {selectedRec.size > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                    <span className="text-[13px] font-medium text-accent-ink">{selectedRec.size} selecionado{selectedRec.size !== 1 ? 's' : ''}</span>
                    <span className="flex-1" />
                    <button className={btnDanger} onClick={() => bulkDeleteRecMut.mutate([...selectedRec])}><Trash2 size={14} /> Remover selecionados</button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead><tr>
                      <th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedRec} onChange={toggleAllRec} /></th>
                      <th className={thCls}>Título</th><th className={thCls}>Vencimento</th>
                      <th className={thNumCls}>Valor</th><th className={thNumCls}>Recebido</th>
                      <th className={thCls}>Status</th><th className={thCls}></th>
                    </tr></thead>
                    <tbody>
                      {recResult.rows.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                      {recResult.rows.map(r => {
                        const st = receivableStatus(r);
                        return (
                          <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                            <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedRec.has(r.id)} onChange={() => toggleOneRec(r.id)} /></td>
                            <td className={tdCls}>
                              <div className="font-medium">{r.title}</div>
                              {r.product && <div className="text-[11.5px] text-ink-3 mt-0.5">{r.product}</div>}
                            </td>
                            <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(r.expiration_date)}</td>
                            <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(r.total_amount)}</td>
                            <td className={`${tdCls} text-right font-mono`}>{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                            <td className={tdCls}><Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge></td>
                            <td className={tdCls} onClick={e => e.stopPropagation()}>
                              <button className={iconBtn} onClick={e => { e.stopPropagation(); openMenu(setTituloMenu, r.id, e); }}><MoreHorizontal size={15} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={tabPages.receber} totalPages={recResult.totalPages} total={filteredRec.length} limit={PAGE_SIZE} onChange={p => setTabPage('receber', p)} />
              </div>
            )}
            {alunoTab === 'pagar' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                {selectedPagar.size > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                    <span className="text-[13px] font-medium text-accent-ink">{selectedPagar.size} selecionado{selectedPagar.size !== 1 ? 's' : ''}</span>
                    <span className="flex-1" />
                    <button className={btnDanger} onClick={() => bulkDeletePayableMut.mutate([...selectedPagar])}><Trash2 size={14} /> Remover selecionados</button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead><tr><th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedPagar} onChange={toggleAllPagar} /></th><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Pago</th><th className={thCls}>Status</th><th className={thCls}></th></tr></thead>
                    <tbody>
                      {pagarResult.rows.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum título a pagar encontrado.</td></tr>}
                      {pagarResult.rows.map(p => (
                        <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                          <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedPagar.has(p.id)} onChange={() => toggleOnePagar(p.id)} /></td>
                          <td className={tdCls}>
                            <div className="font-medium">{p.title}</div>
                            {p.product && <div className="text-[11.5px] text-ink-3 mt-0.5">{p.product}</div>}
                          </td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{p.due_date ? formatDate(p.due_date) : '—'}</td>
                          <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount)}</td>
                          <td className={`${tdCls} text-right font-mono`}>{Number(p.amount_paid) > 0 ? `R$ ${formatBRL(p.amount_paid)}` : '—'}</td>
                          <td className={tdCls}><Badge variant={(P_STATUS_BADGE[p.status] ?? 'default') as BadgeVariant}>{P_STATUS_LABEL[p.status] ?? p.status}</Badge></td>
                          <td className={tdCls} onClick={e => e.stopPropagation()}>
                            <button className={iconBtn} onClick={e => { e.stopPropagation(); openMenu(setPayableMenu, p.id, e); }}><MoreHorizontal size={15} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={tabPages.pagar} totalPages={pagarResult.totalPages} total={filteredPagar.length} limit={PAGE_SIZE} onChange={p => setTabPage('pagar', p)} />
              </div>
            )}
            {alunoTab === 'faturas' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="flex items-center justify-end px-3 py-2.5 border-b border-line">
                  <button className={btnPrimary} onClick={() => setNewFaturaModal(true)}><Plus size={14} /> Nova fatura</button>
                </div>
                {selectedFatura.size > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                    <span className="text-[13px] font-medium text-accent-ink">{selectedFatura.size} selecionado{selectedFatura.size !== 1 ? 's' : ''}</span>
                    <span className="flex-1" />
                    <button className={btnDanger} onClick={() => bulkDeleteFaturaMut.mutate([...selectedFatura])}><Trash2 size={14} /> Remover selecionados</button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead><tr><th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedFatura} onChange={toggleAllFatura} /></th><th className={thCls}>Nº</th><th className={thCls}>Emissão</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thCls}>Itens</th><th className={thCls}></th></tr></thead>
                    <tbody>
                      {faturasResult.rows.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhuma fatura encontrada.</td></tr>}
                      {faturasResult.rows.map(b => (
                        <tr key={b.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/invoices/${b.id}`)}>
                          <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedFatura.has(b.id)} onChange={() => toggleOneFatura(b.id)} /></td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{b.id}</td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(b.issue_date)}</td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{b.due_date ? formatDate(b.due_date) : '—'}</td>
                          <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(b.total_amount)}</td>
                          <td className={`${tdCls} text-ink-3 text-[13px]`}>{b.items?.length ?? 0} {(b.items?.length ?? 0) === 1 ? 'título' : 'títulos'}</td>
                          <td className={tdCls} onClick={e => e.stopPropagation()}>
                            <button className={iconBtn} onClick={e => { e.stopPropagation(); openMenu(setFaturaMenu, b.id, e); }}><MoreHorizontal size={15} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={tabPages.faturas} totalPages={faturasResult.totalPages} total={filteredFaturas.length} limit={PAGE_SIZE} onChange={p => setTabPage('faturas', p)} />
              </div>
            )}
            {alunoTab === 'creditos' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="flex items-center justify-end px-3 py-2.5 border-b border-line">
                  <button className={btnPrimary} onClick={() => setCreditModal(true)}><Plus size={14} /> Adicionar crédito</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead><tr><th className={thCls}>Data</th><th className={thCls}>Título</th><th className={thNumCls}>Valor</th></tr></thead>
                    <tbody>
                      {creditosResult.rows.length === 0 && <tr><td colSpan={3} className="px-3.5 py-8 text-center text-ink-3">Nenhuma movimentação registrada.</td></tr>}
                      {creditosResult.rows.map((m: any) => (
                        <tr key={`${m.kind}-${m.id}`} className="hover:bg-bg-hover">
                          <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(m.payment_date)}</td>
                          <td className={tdCls}>{m.receivable?.title ?? '—'}</td>
                          <td className={`${tdCls} text-right font-mono`} style={{ color: m.kind === 'addition' ? 'var(--success)' : 'var(--danger)' }}>
                            {m.kind === 'addition' ? '+' : '−'} R$ {formatBRL(m.amount_received)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={tabPages.creditos} totalPages={creditosResult.totalPages} total={filteredCreditos.length} limit={PAGE_SIZE} onChange={p => setTabPage('creditos', p)} />
              </div>
            )}
          </div>
        )}

        {/* ── ALUNO ── */}
        {activeRoleTab === 'aluno' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Voos</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><PlaneIcon size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Voos</div>
                    <div className="text-[20px] font-bold tracking-tight">{flights.length}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Timer size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Horas de voo</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono">{formatHours(flights.reduce((s, f) => s + Number(f.total_hours ?? 0), 0))}</div>
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
            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="flex items-center justify-end px-3 py-2.5 border-b border-line">
                <button className={btnPrimary} onClick={() => setNewVooModal(true)}><Plus size={14} /> Novo voo</button>
              </div>
              {selectedVoo.size > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                  <span className="text-[13px] font-medium text-accent-ink">{selectedVoo.size} selecionado{selectedVoo.size !== 1 ? 's' : ''}</span>
                  <span className="flex-1" />
                  <button className={btnDanger} onClick={() => bulkDeleteVooMut.mutate([...selectedVoo])}><Trash2 size={14} /> Remover selecionados</button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedVoo} onChange={toggleAllVoo} /></th><th className={thCls}>Tipo</th><th className={thCls}>Rota</th><th className={thCls}>Início</th><th className={thNumCls}>Horas</th><th className={thNumCls}>Valor</th><th className={thCls}></th></tr></thead>
                  <tbody>
                    {voosResult.rows.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum voo encontrado.</td></tr>}
                    {voosResult.rows.map(f => (
                      <tr key={f.id} className="hover:bg-bg-hover">
                        <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedVoo.has(f.id)} onChange={() => toggleOneVoo(f.id)} /></td>
                        <td className={tdCls}>{f.type}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{f.origin} → {f.destination}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(f.start_date)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{formatHours(f.total_hours)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—'}</td>
                        <td className={tdCls} onClick={e => e.stopPropagation()}>
                          <button className={iconBtn} onClick={e => { e.stopPropagation(); openMenu(setVooMenu, f.id, e); }}><MoreHorizontal size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.voos} totalPages={voosResult.totalPages} total={filteredVoos.length} limit={PAGE_SIZE} onChange={p => setTabPage('voos', p)} />
            </div>

            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-line text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Títulos a receber</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Recebido</th><th className={thCls}>Status</th></tr></thead>
                  <tbody>
                    {recResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                    {recResult.rows.map(r => { const st = receivableStatus(r); return (
                      <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                        <td className={`${tdCls} font-medium`}>{r.title}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(r.expiration_date)}</td>
                        <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(r.total_amount)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                        <td className={tdCls}><Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.receber} totalPages={recResult.totalPages} total={filteredRec.length} limit={PAGE_SIZE} onChange={p => setTabPage('receber', p)} />
            </div>

            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-line text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Títulos a pagar</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Pago</th><th className={thCls}>Status</th></tr></thead>
                  <tbody>
                    {pagarResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                    {pagarResult.rows.map(p => (
                      <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                        <td className={`${tdCls} font-medium`}>{p.title}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{p.due_date ? formatDate(p.due_date) : '—'}</td>
                        <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{Number(p.amount_paid) > 0 ? `R$ ${formatBRL(p.amount_paid)}` : '—'}</td>
                        <td className={tdCls}><Badge variant={(P_STATUS_BADGE[p.status] ?? 'default') as BadgeVariant}>{P_STATUS_LABEL[p.status] ?? p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.pagar} totalPages={pagarResult.totalPages} total={filteredPagar.length} limit={PAGE_SIZE} onChange={p => setTabPage('pagar', p)} />
            </div>
          </div>
        )}

        {/* ── SÓCIO ── */}
        {activeRoleTab === 'socio' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Mensalidades</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Calendar size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Quantidade</div>
                    <div className="text-[20px] font-bold tracking-tight">{mensalidadeRecs.length}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><BarChart3 size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Valor total</div>
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
                    <div className="text-[20px] font-bold tracking-tight">{flights.length}</div>
                  </div>
                </div>
                <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Timer size={18} /></div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-ink-3 font-medium">Horas de voo</div>
                    <div className="text-[20px] font-bold tracking-tight font-mono">{formatHours(flights.reduce((s, f) => s + Number(f.total_hours ?? 0), 0))}</div>
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
            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Recebido</th><th className={thCls}>Status</th></tr></thead>
                  <tbody>
                    {mensalidadesResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhuma mensalidade encontrada.</td></tr>}
                    {mensalidadesResult.rows.map(r => {
                      const st = receivableStatus(r);
                      return (
                        <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                          <td className={`${tdCls} font-medium`}>{r.title}</td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(r.expiration_date)}</td>
                          <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(r.total_amount)}</td>
                          <td className={`${tdCls} text-right font-mono`}>{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                          <td className={tdCls}><Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.mensalidades} totalPages={mensalidadesResult.totalPages} total={mensalidadeRecs.length} limit={PAGE_SIZE} onChange={p => setTabPage('mensalidades', p)} />
            </div>

            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-line text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Voos</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Tipo</th><th className={thCls}>Rota</th><th className={thCls}>Início</th><th className={thNumCls}>Horas</th><th className={thNumCls}>Valor</th></tr></thead>
                  <tbody>
                    {voosResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum voo encontrado.</td></tr>}
                    {voosResult.rows.map(f => (
                      <tr key={f.id} className="hover:bg-bg-hover">
                        <td className={tdCls}>{f.type}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{f.origin} → {f.destination}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(f.start_date)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{formatHours(f.total_hours)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.voos} totalPages={voosResult.totalPages} total={filteredVoos.length} limit={PAGE_SIZE} onChange={p => setTabPage('voos', p)} />
            </div>

            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-line text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Títulos a receber</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Recebido</th><th className={thCls}>Status</th></tr></thead>
                  <tbody>
                    {recResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                    {recResult.rows.map(r => { const st = receivableStatus(r); return (
                      <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                        <td className={`${tdCls} font-medium`}>{r.title}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(r.expiration_date)}</td>
                        <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(r.total_amount)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                        <td className={tdCls}><Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.receber} totalPages={recResult.totalPages} total={filteredRec.length} limit={PAGE_SIZE} onChange={p => setTabPage('receber', p)} />
            </div>

            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-line text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Títulos a pagar</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Pago</th><th className={thCls}>Status</th></tr></thead>
                  <tbody>
                    {pagarResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                    {pagarResult.rows.map(p => (
                      <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                        <td className={`${tdCls} font-medium`}>{p.title}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{p.due_date ? formatDate(p.due_date) : '—'}</td>
                        <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{Number(p.amount_paid) > 0 ? `R$ ${formatBRL(p.amount_paid)}` : '—'}</td>
                        <td className={tdCls}><Badge variant={(P_STATUS_BADGE[p.status] ?? 'default') as BadgeVariant}>{P_STATUS_LABEL[p.status] ?? p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.pagar} totalPages={pagarResult.totalPages} total={filteredPagar.length} limit={PAGE_SIZE} onChange={p => setTabPage('pagar', p)} />
            </div>
          </div>
        )}

        {/* ── INSTRUTOR ── */}
        {activeRoleTab === 'instrutor' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead><tr><th className={thCls}>Cliente</th><th className={thCls}>Tipo</th><th className={thCls}>Rota</th><th className={thCls}>Início</th><th className={thNumCls}>Horas</th><th className={thNumCls}>Valor</th></tr></thead>
                    <tbody>
                      {instrVoosResult.rows.length === 0 && <tr><td colSpan={6} className="px-3.5 py-6 text-center text-ink-3">Nenhum voo instruído encontrado.</td></tr>}
                      {instrVoosResult.rows.map((f: any) => (
                        <tr key={f.id} className="hover:bg-bg-hover">
                          <td className={`${tdCls} font-medium`}>{f.customer?.name ?? `#${f.customer_id}`}</td>
                          <td className={tdCls}>{f.type}</td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{f.origin} → {f.destination}</td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(f.start_date)}</td>
                          <td className={`${tdCls} text-right font-mono`}>{formatHours(f.total_hours)}</td>
                          <td className={`${tdCls} text-right font-mono`}>{f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={tabPages.voos_instrutor} totalPages={instrVoosResult.totalPages} total={instructorFlights.length} limit={PAGE_SIZE} onChange={p => setTabPage('voos_instrutor', p)} />
              </div>
            )}
            {instrTab === 'titulos_instrutor' && (
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead><tr><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Pago</th><th className={thCls}>Status</th></tr></thead>
                    <tbody>
                      {instrPayResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                      {instrPayResult.rows.map((p: any) => (
                        <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                          <td className={tdCls}>
                            <div className="font-medium">{p.title}</div>
                            {p.product && <div className="text-[11.5px] text-ink-3 mt-0.5">{p.product}</div>}
                          </td>
                          <td className={`${tdCls} font-mono text-[12px]`}>{p.due_date ? formatDate(p.due_date) : '—'}</td>
                          <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount)}</td>
                          <td className={`${tdCls} text-right font-mono`}>{Number(p.amount_paid) > 0 ? `R$ ${formatBRL(p.amount_paid)}` : '—'}</td>
                          <td className={tdCls}><Badge variant={(P_STATUS_BADGE[p.status] ?? 'default') as BadgeVariant}>{P_STATUS_LABEL[p.status] ?? p.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={tabPages.titulos_instrutor} totalPages={instrPayResult.totalPages} total={instructorPayables.length} limit={PAGE_SIZE} onChange={p => setTabPage('titulos_instrutor', p)} />
              </div>
            )}
          </div>
        )}

        {/* ── FUNCIONÁRIO ── */}
        {activeRoleTab === 'funcionario' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Pago</th><th className={thCls}>Status</th></tr></thead>
                  <tbody>
                    {empPayResult.rows.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                    {empPayResult.rows.map((p: any) => (
                      <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                        <td className={tdCls}>
                          <div className="font-medium">{p.title}</div>
                          {p.product && <div className="text-[11.5px] text-ink-3 mt-0.5">{p.product}</div>}
                        </td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{p.due_date ? formatDate(p.due_date) : '—'}</td>
                        <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{Number(p.amount_paid) > 0 ? `R$ ${formatBRL(p.amount_paid)}` : '—'}</td>
                        <td className={tdCls}><Badge variant={(P_STATUS_BADGE[p.status] ?? 'default') as BadgeVariant}>{P_STATUS_LABEL[p.status] ?? p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.func_pagar} totalPages={empPayResult.totalPages} total={employeePayables.length} limit={PAGE_SIZE} onChange={p => setTabPage('func_pagar', p)} />
            </div>
          </div>
        )}
      </div>

      {tituloMenu && menuTitulo && (
        <RowMenu top={tituloMenu.top} right={tituloMenu.right} onClose={() => setTituloMenu(null)}>
          <button className={rowMenuBtn} onClick={() => navigate(`/receivables/${menuTitulo.id}`)}><Eye size={14} /> Ver detalhes</button>
          <button className={rowMenuBtn} onClick={() => setEditTitulo(menuTitulo)}><Edit size={14} /> Editar</button>
          {receivableStatus(menuTitulo) !== 'paid' && <button className={rowMenuBtn} onClick={() => setSettleTitulo(menuTitulo)}><Check size={14} /> Receber</button>}
          <RowMenuSep />
          <button className={rowMenuBtnDanger} onClick={() => deleteTituloMut.mutate(menuTitulo.id)}><Trash2 size={14} /> Remover</button>
        </RowMenu>
      )}

      {vooMenu && menuVoo && (
        <RowMenu top={vooMenu.top} right={vooMenu.right} onClose={() => setVooMenu(null)}>
          {!menuVoo.end_date && <button className={rowMenuBtn} onClick={() => { setVooMenu(null); setCloseVoo(menuVoo); }}><Check size={14} /> Encerrar voo</button>}
          <button className={rowMenuBtn} onClick={() => setEditVoo(menuVoo)}><Edit size={14} /> Editar</button>
          <RowMenuSep />
          <button className={rowMenuBtnDanger} onClick={() => deleteVooMut.mutate(menuVoo.id)}><Trash2 size={14} /> Remover</button>
        </RowMenu>
      )}

      {faturaMenu && menuFatura && (
        <RowMenu top={faturaMenu.top} right={faturaMenu.right} onClose={() => setFaturaMenu(null)}>
          <button className={rowMenuBtn} onClick={() => navigate(`/invoices/${menuFatura.id}`)}><Eye size={14} /> Ver detalhes</button>
          <RowMenuSep />
          <button className={rowMenuBtnDanger} onClick={() => deleteFaturaMut.mutate(menuFatura.id)}><Trash2 size={14} /> Estornar</button>
        </RowMenu>
      )}

      {payableMenu && menuPayable && (
        <RowMenu top={payableMenu.top} right={payableMenu.right} onClose={() => setPayableMenu(null)}>
          <button className={rowMenuBtn} onClick={() => navigate(`/payables/${menuPayable.id}`)}><Eye size={14} /> Ver detalhes</button>
          {menuPayable.status !== 'closed' && <button className={rowMenuBtn} onClick={() => { setPayableMenu(null); setPayPayable(menuPayable); }}><Check size={14} /> Pagar</button>}
          <RowMenuSep />
          <button className={rowMenuBtnDanger} onClick={() => deletePayableMut.mutate(menuPayable.id)}><Trash2 size={14} /> Remover</button>
        </RowMenu>
      )}

      {newTituloModal && <NewTituloModal customerId={customerId} onClose={() => setNewTituloModal(false)} onSave={d => createTituloMut.mutate(d)} />}
      {creditModal && <NewCreditModal customerId={customerId} onClose={() => setCreditModal(false)} onSuccess={() => setCreditModal(false)} />}
      {editTitulo && <EditTituloModal rec={editTitulo} onClose={() => setEditTitulo(null)} onSave={d => updateTituloMut.mutate({ id: editTitulo.id, data: d })} />}
      {settleTitulo && <SettleTituloModal rec={settleTitulo} creditBalance={creditBalance} onClose={() => setSettleTitulo(null)} onSave={d => settleMut.mutate({ id: settleTitulo.id, data: d as Parameters<typeof registerPayment>[1] })} />}

      {newVooModal && <FlightModal mode="new" customers={allCustomers} planes={planes} initialCustomerId={customerId} onClose={() => setNewVooModal(false)} onSave={d => createVooMut.mutate(d)} />}
      {editVoo && <FlightModal mode="edit" flight={editVoo} customers={allCustomers} planes={planes} onClose={() => setEditVoo(null)} onSave={(data) => updateVooMut.mutate({ id: editVoo.id, data })} />}
      {closeVoo && <CloseFlightModal flight={closeVoo} onClose={() => setCloseVoo(null)} onSave={end_date => closeVooMut.mutate({ id: closeVoo.id, end_date })} />}

      {newFaturaModal && <NewFaturaModal receivables={receivables} customerId={customerId} onClose={() => setNewFaturaModal(false)} onSave={d => createFaturaMut.mutate(d)} />}

      {payPayable && <PayModal payable={payPayable} onClose={() => setPayPayable(null)} onSave={d => payMut.mutate(d)} />}
      {editCustomerModal && <CustomerModal mode="edit" customer={customer} onClose={() => setEditCustomerModal(false)} onSave={data => updateCustomerMut.mutate(data)} />}

    </div>
  );
}
