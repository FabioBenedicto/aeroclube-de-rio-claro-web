import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Check, X, Edit, Trash2, MoreHorizontal, Eye, TrendingDown } from 'lucide-react';
import { getCustomer, getCustomerCredits, addCredit, getCustomers } from '../../api/customers';
import { createReceivable, updateReceivable, deleteReceivable, registerPayment } from '../../api/receivables';
import { getPayables, deletePayable, registerPayablePayment } from '../../api/payables';
import { createFlight, closeFlight, deleteFlight } from '../../api/flights';
import { createBill, deleteBill, getBillsByCustomer } from '../../api/invoices';
import { getPlanes } from '../../api/planes';
import DateInput from '../../components/DateInput';
import PayModal from '../../components/PayModal';
import { formatBRL, formatDate, formatDateTime, formatHours, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import FlightModal from '../flights/FlightModal';
import CloseFlightModal from '../flights/CloseFlightModal';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';
import type { Receivable, Flight, Bill, Payable } from '../../types';

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

function NewTituloModal({ customerId, onClose, onSave }: { customerId: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: '', product: 'voo', expiration_date: '', total_amount: '' });
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
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
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
            expiration_date: form.expiration_date,
            total_amount: parseFloat(form.total_amount),
            payer_type: 'customer',
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
          <button className={btnPrimary} onClick={() => onSave({ title: form.title, expiration_date: form.expiration_date, total_amount: parseFloat(form.total_amount) })}><Check size={14} /> Salvar</button>
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
              <input type="checkbox" className="w-4 h-4 accent-[var(--accent)]" checked={useCredit} onChange={e => setUseCredit(e.target.checked)} />
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

function NewFaturaModal({ receivables, customerId, onClose, onSave }: { receivables: Receivable[]; customerId: number; onClose: () => void; onSave: (d: { customer_id: number; items: { receivable_id: number; amount: number }[]; payment_method?: string }) => void }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [method, setMethod] = useState('PIX');
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
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
              <select className={inputCls} value={method} onChange={e => setMethod(e.target.value)}>
                <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Cheque</option>
              </select>
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
                      <td className={tdCls}><input type="checkbox" checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} /></td>
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
            onClick={() => onSave({ customer_id: customerId, payment_method: method, items: Object.entries(selected).map(([id, amount]) => ({ receivable_id: Number(id), amount })) })}>
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

  const [tab, setTab] = useState<'voos' | 'receber' | 'pagar' | 'faturas' | 'creditos'>('receber');

  const [tituloMenu, setTituloMenu] = useState<MenuState | null>(null);
  const [vooMenu, setVooMenu] = useState<MenuState | null>(null);
  const [faturaMenu, setFaturaMenu] = useState<MenuState | null>(null);
  const [payableMenu, setPayableMenu] = useState<MenuState | null>(null);

  const [creditModal, setCreditModal] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: '', notes: '' });

  const [newTituloModal, setNewTituloModal] = useState(false);
  const [newVooModal, setNewVooModal] = useState(false);
  const [newFaturaModal, setNewFaturaModal] = useState(false);

  const [editTitulo, setEditTitulo] = useState<Receivable | null>(null);
  const [settleTitulo, setSettleTitulo] = useState<Receivable | null>(null);
  const [editVoo, setEditVoo] = useState<Flight | null>(null);
  const [closeVoo, setCloseVoo] = useState<Flight | null>(null);
  const [payPayable, setPayPayable] = useState<Payable | null>(null);

  const [selectedRec, setSelectedRec] = useState<Set<number>>(new Set());
  const [selectedVoo, setSelectedVoo] = useState<Set<number>>(new Set());
  const [selectedFatura, setSelectedFatura] = useState<Set<number>>(new Set());
  const [selectedPagar, setSelectedPagar] = useState<Set<number>>(new Set());

  const addCreditMut = useMutation({
    mutationFn: (data: { amount: number; notes?: string }) => addCredit(customerId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits', customerId] }); qc.invalidateQueries({ queryKey: ['customer', customerId] }); setCreditModal(false); setCreditForm({ amount: '', notes: '' }); },
  });

  const createTituloMut = useMutation({
    mutationFn: createReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setNewTituloModal(false); },
  });
  const updateTituloMut = useMutation({
    mutationFn: ({ id: rid, data }: { id: number; data: unknown }) => updateReceivable(rid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setEditTitulo(null); },
  });
  const deleteTituloMut = useMutation({
    mutationFn: deleteReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
  });
  const bulkDeleteRecMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deleteReceivable)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelectedRec(new Set()); },
  });
  const settleMut = useMutation({
    mutationFn: ({ id: rid, data }: { id: number; data: Parameters<typeof registerPayment>[1] }) => registerPayment(rid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); qc.invalidateQueries({ queryKey: ['credits', customerId] }); setSettleTitulo(null); },
  });

  const createVooMut = useMutation({
    mutationFn: createFlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setNewVooModal(false); },
  });
  const closeVooMut = useMutation({
    mutationFn: ({ id: fid, end_date }: { id: number; end_date: string }) => closeFlight(fid, end_date),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setCloseVoo(null); },
  });
  const deleteVooMut = useMutation({
    mutationFn: deleteFlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); },
  });
  const bulkDeleteVooMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deleteFlight)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['flights'] }); setSelectedVoo(new Set()); },
  });

  const createFaturaMut = useMutation({
    mutationFn: createBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', customerId] }); qc.invalidateQueries({ queryKey: ['customer', customerId] }); setNewFaturaModal(false); },
  });
  const deleteFaturaMut = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', customerId] }); qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
  });
  const bulkDeleteFaturaMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deleteBill)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills', customerId] }); qc.invalidateQueries({ queryKey: ['customer', customerId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelectedFatura(new Set()); },
  });

  const deletePayableMut = useMutation({
    mutationFn: deletePayable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payables', 'customer', customerId] }),
  });
  const bulkDeletePayableMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deletePayable)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables', 'customer', customerId] }); setSelectedPagar(new Set()); },
  });
  const payMut = useMutation({
    mutationFn: (d: unknown) => registerPayablePayment(payPayable!.id, d as { amount: number; method?: string; paid_at?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables', 'customer', customerId] }); setPayPayable(null); },
  });

  if (isLoading) return <div className="p-8 text-[13px] text-ink-3">Carregando…</div>;
  if (!customer) return <div className="p-8 text-[13px] text-ink-3">Pessoa não encontrada.</div>;

  const receivables = customer.receivables ?? [];
  const instructorReceivables = customer.instructors[0]?.receivables ?? [];
  const payerReceivables = receivables.filter(
    r => r.payer_type === 'customer' || r.payer_type == null,
  );
  const associatedReceivables = [
    ...receivables.filter(r => r.payer_type !== 'customer' && r.payer_type != null),
    ...instructorReceivables,
  ].filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i);
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

  const allIdsPagar = customerPayables.map(p => p.id);
  const allSelectedPagar = allIdsPagar.length > 0 && allIdsPagar.every(id => selectedPagar.has(id));
  function toggleAllPagar() { setSelectedPagar(allSelectedPagar ? new Set() : new Set(allIdsPagar)); }
  function toggleOnePagar(id: number) { setSelectedPagar(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const totalAberto = payerReceivables.reduce(
    (s, r) => s + Math.max(0, Number(r.total_amount) - Number(r.amount_received)),
    0,
  );
  const totalAPagar = customerPayables.reduce((s, p) => s + Math.max(0, Number(p.amount) - Number(p.amount_paid)), 0);
  const creditBalance = credits?.flight_hour_balance ?? 0;

  const TABS = [
    { key: 'voos' as const, label: 'Voos' },
    { key: 'receber' as const, label: 'Títulos a receber' },
    { key: 'pagar' as const, label: 'Títulos a pagar' },
    { key: 'faturas' as const, label: 'Faturas' },
    { key: 'creditos' as const, label: 'Créditos' },
  ];

  const bulkBar = (count: number, onDelete: () => void) => count > 0 ? (
    <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border border-line rounded-lg">
      <span className="text-[13px] font-medium text-accent-ink">{count} selecionado{count !== 1 ? 's' : ''}</span>
      <span className="flex-1" />
      <button className={btnDanger} onClick={onDelete}><Trash2 size={14} /> Remover selecionados</button>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/pessoas')}><ChevronLeft size={15} /> Voltar</button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{customer.name}</h1>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <span className="text-[13px] text-ink-3 font-mono text-[12px]">{customer.cpf} · {customer.email}</span>
            {customer.categories.map(cat => (
              <Chip key={cat} variant={cat as ChipVariant} className="ml-1">
                {cat === 'socio' ? 'sócio' : cat}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">A receber</div>
          <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono" style={{ color: totalAberto > 0 ? 'var(--danger)' : undefined }}>
            <span className="text-[14px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(totalAberto)}
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">A pagar</div>
          <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono" style={{ color: totalAPagar > 0 ? 'var(--warn)' : undefined }}>
            <span className="text-[14px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(totalAPagar)}
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Créditos disponíveis</div>
          <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono" style={{ color: creditBalance > 0 ? 'var(--success)' : undefined }}>
            <span className="text-[14px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(creditBalance)}
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Voos registrados</div>
          <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono">{flights.length}</div>
        </div>
      </div>

      <div className="flex border-b border-line">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
            style={{ borderBottomColor: tab === t.key ? 'var(--accent)' : 'transparent' }}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'voos' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button className={btnPrimary} onClick={() => setNewVooModal(true)}><Plus size={14} /> Registrar voo</button>
          </div>
          {bulkBar(selectedVoo.size, () => bulkDeleteVooMut.mutate([...selectedVoo]))}
          <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead><tr><th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedVoo} onChange={toggleAllVoo} /></th><th className={thCls}>Tipo</th><th className={thCls}>Rota</th><th className={thCls}>Início</th><th className={thNumCls}>Horas</th><th className={thNumCls}>Valor</th><th className={thCls}></th></tr></thead>
                <tbody>
                  {flights.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum voo encontrado.</td></tr>}
                  {flights.map(f => (
                    <tr key={f.id} className="hover:bg-bg-hover">
                      <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedVoo.has(f.id)} onChange={() => toggleOneVoo(f.id)} /></td>
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
          </div>
        </div>
      )}

      {tab === 'receber' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button className={btnPrimary} onClick={() => setNewTituloModal(true)}><Plus size={14} /> Novo título</button>
          </div>
          {bulkBar(selectedRec.size, () => bulkDeleteRecMut.mutate([...selectedRec]))}
          <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead><tr>
                  <th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedRec} onChange={toggleAllRec} /></th>
                  <th className={thCls}>Título</th><th className={thCls}>Vencimento</th>
                  <th className={thNumCls}>Valor</th><th className={thNumCls}>Recebido</th>
                  <th className={thCls}>Status</th><th className={thCls}></th>
                </tr></thead>
                <tbody>
                  {payerReceivables.length === 0 && (
                    <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>
                  )}
                  {payerReceivables.map(r => {
                    const st = receivableStatus(r);
                    return (
                      <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                        <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedRec.has(r.id)} onChange={() => toggleOneRec(r.id)} />
                        </td>
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
          </div>

          {associatedReceivables.length > 0 && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mt-2">Títulos associados</div>
              <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead><tr>
                      <th className={thCls}>Título</th>
                      <th className={thCls}>Pagador</th>
                      <th className={thCls}>Vencimento</th>
                      <th className={thNumCls}>Valor</th>
                      <th className={thCls}>Status</th>
                    </tr></thead>
                    <tbody>
                      {associatedReceivables.map(r => {
                        const st = receivableStatus(r);
                        const payerLabel: Record<string, string> = { customer: 'Cliente', company: 'Empresa', instructor: 'Instrutor', none: '—' };
                        return (
                          <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                            <td className={tdCls}>
                              <div className="font-medium">{r.title}</div>
                              {r.product && <div className="text-[11.5px] text-ink-3 mt-0.5">{r.product}</div>}
                            </td>
                            <td className={tdCls}>
                              <span className="text-[12px] text-ink-3">{payerLabel[r.payer_type ?? 'none']}</span>
                            </td>
                            <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(r.expiration_date)}</td>
                            <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(r.total_amount)}</td>
                            <td className={tdCls}><Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'pagar' && (
        <div className="flex flex-col gap-4">
          {bulkBar(selectedPagar.size, () => bulkDeletePayableMut.mutate([...selectedPagar]))}
          <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead><tr><th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedPagar} onChange={toggleAllPagar} /></th><th className={thCls}>Título</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thNumCls}>Pago</th><th className={thCls}>Status</th><th className={thCls}></th></tr></thead>
                <tbody>
                  {customerPayables.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum título a pagar encontrado.</td></tr>}
                  {customerPayables.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                      <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedPagar.has(p.id)} onChange={() => toggleOnePagar(p.id)} /></td>
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
          </div>
        </div>
      )}

      {tab === 'faturas' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button className={btnPrimary} onClick={() => setNewFaturaModal(true)}><Plus size={14} /> Nova fatura</button>
          </div>
          {bulkBar(selectedFatura.size, () => bulkDeleteFaturaMut.mutate([...selectedFatura]))}
          <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead><tr><th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedFatura} onChange={toggleAllFatura} /></th><th className={thCls}>Nº</th><th className={thCls}>Emissão</th><th className={thCls}>Vencimento</th><th className={thNumCls}>Valor</th><th className={thCls}>Itens</th><th className={thCls}></th></tr></thead>
                <tbody>
                  {bills.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhuma fatura encontrada.</td></tr>}
                  {bills.map(b => (
                    <tr key={b.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/invoices/${b.id}`)}>
                      <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedFatura.has(b.id)} onChange={() => toggleOneFatura(b.id)} /></td>
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
          </div>
        </div>
      )}

      {tab === 'creditos' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 bg-bg-elev border border-line rounded-lg px-6 py-5 flex items-center gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1.5">Saldo disponível</div>
                <div className="font-mono text-[28px] font-bold tracking-[-0.5px]" style={{ color: creditBalance > 0 ? 'var(--success)' : 'var(--ink-3)' }}>
                  R$ {formatBRL(creditBalance)}
                </div>
              </div>
              {creditBalance > 0 && (
                <div className="ml-auto flex items-center gap-2 px-3.5 py-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--success) 12%, transparent)' }}>
                  <TrendingDown size={14} style={{ color: 'var(--success)' }} />
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--success)' }}>Aplicado automaticamente nos próximos pagamentos</span>
                </div>
              )}
            </div>
            <button className={`${btnPrimary} flex-shrink-0`} onClick={() => setCreditModal(true)}><Plus size={14} /> Adicionar crédito</button>
          </div>

          <div>
            <h2 className="text-[15px] font-semibold mb-3">Movimentações</h2>
            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr><th className={thCls}>Data</th><th className={thCls}>Forma de pagamento</th><th className={thNumCls}>Valor utilizado</th></tr></thead>
                  <tbody>
                    {(credits?.movements ?? []).length === 0 && (
                      <tr><td colSpan={3} className="px-3.5 py-8 text-center text-ink-3">Nenhuma movimentação registrada.</td></tr>
                    )}
                    {(credits?.movements ?? []).map(m => (
                      <tr key={m.id} className="hover:bg-bg-hover">
                        <td className={`${tdCls} font-mono text-[12px]`}>{formatDateTime(m.payment_date)}</td>
                        <td className={tdCls}>{m.payment_method ?? '—'}</td>
                        <td className={`${tdCls} text-right font-mono text-danger`}>− R$ {formatBRL(m.amount_received)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

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
      {editTitulo && <EditTituloModal rec={editTitulo} onClose={() => setEditTitulo(null)} onSave={d => updateTituloMut.mutate({ id: editTitulo.id, data: d })} />}
      {settleTitulo && <SettleTituloModal rec={settleTitulo} creditBalance={creditBalance} onClose={() => setSettleTitulo(null)} onSave={d => settleMut.mutate({ id: settleTitulo.id, data: d as Parameters<typeof registerPayment>[1] })} />}

      {newVooModal && <FlightModal mode="new" customers={allCustomers} planes={planes} initialCustomerId={customerId} onClose={() => setNewVooModal(false)} onSave={d => createVooMut.mutate(d)} />}
      {editVoo && <FlightModal mode="edit" flight={editVoo} customers={allCustomers} planes={planes} onClose={() => setEditVoo(null)} onSave={() => { qc.invalidateQueries({ queryKey: ['customer', customerId] }); setEditVoo(null); }} />}
      {closeVoo && <CloseFlightModal flight={closeVoo} onClose={() => setCloseVoo(null)} onSave={end_date => closeVooMut.mutate({ id: closeVoo.id, end_date })} />}

      {newFaturaModal && <NewFaturaModal receivables={receivables} customerId={customerId} onClose={() => setNewFaturaModal(false)} onSave={d => createFaturaMut.mutate(d)} />}

      {payPayable && <PayModal payable={payPayable} onClose={() => setPayPayable(null)} onSave={d => payMut.mutate(d)} />}

      {creditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setCreditModal(false)}>
          <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
              <h3 className="text-[15px] font-semibold m-0">Adicionar crédito</h3>
              <button className={iconBtn} onClick={() => setCreditModal(false)}><X size={16} /></button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Valor (R$)</label>
                <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                  <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg border-r border-line select-none">R$</span>
                  <input className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0" type="number" step="0.01" min="0.01" value={creditForm.amount} onChange={e => setCreditForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Observações</label>
                <textarea className={textareaCls} value={creditForm.notes} onChange={e => setCreditForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
              <button className={btnCancel} onClick={() => setCreditModal(false)}>Cancelar</button>
              <button className={btnPrimary} onClick={() => addCreditMut.mutate({ amount: parseFloat(creditForm.amount), notes: creditForm.notes || undefined })}>
                <Check size={14} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
