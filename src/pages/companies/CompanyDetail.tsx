import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, MoreHorizontal, Trash2, Check, X, Edit, ArrowDownLeft, ArrowUpRight, Clock, Hourglass } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { getCompany, updateCompany } from '../../api/companies';
import { createReceivable, deleteReceivable, bulkDeleteReceivables, registerPayment } from '../../api/receivables';
import { createPayable, deletePayable, bulkDeletePayables, registerPayablePayment } from '../../api/payables';
import DateInput from '../../components/DateInput';
import Pagination from '../../components/Pagination';
import { getPlanes } from '../../api/planes';
import { formatBRL, formatDate, receivableStatus, payableStatus, STATUS_LABEL, STATUS_BADGE, PAYABLE_STATUS_LABEL } from '../../utils/format';
import { maskCNPJ, maskPhone, validateCNPJ } from '../../utils/masks';
import type { Receivable, Payable, Company } from '../../types';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import DateRangeFilter from '../../components/DateRangeFilter';
import Badge from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
import { toast, extractErrorMessage } from '../../utils/toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

type MenuState = { id: number; top: number; right: number };
type BadgeVariant = 'success' | 'warn' | 'danger' | 'accent' | 'default';


const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';
function NewReceivableModal({ companyId, onClose, onSave }: { companyId: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: '', product: 'servico', expiration_date: '', total_amount: '', plane_id: '', flight_id: '' });
  const { data: planesData } = useQuery({ queryKey: ['planes-all'], queryFn: () => getPlanes(1, 100) });
  const planes = planesData?.data ?? [];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">Novo título a receber</h3>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Tipo</label>
            <Select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
              <option value="servico">Serviço</option><option value="mensalidade">Mensalidade</option><option value="outro">Outro</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Título</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
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
                <input type="number" step="0.01" className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0" placeholder="0,00" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
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
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!form.title || !form.total_amount}
            onClick={() => onSave({
              company_id: companyId, title: form.title, product: form.product,
              expiration_date: form.expiration_date || undefined, total_amount: parseFloat(form.total_amount),
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

function NewPayableModal({ companyId, onClose, onSave }: { companyId: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: '', product: 'servico', due_date: '', amount: '', plane_id: '', flight_id: '' });
  const { data: planesData } = useQuery({ queryKey: ['planes-all'], queryFn: () => getPlanes(1, 100) });
  const planes = planesData?.data ?? [];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">Novo título a pagar</h3>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Tipo</label>
            <Select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
              <option value="servico">Serviço</option><option value="manutencao">Manutenção</option><option value="outro">Outro</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Título</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
              <DateInput value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor</label>
              <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg border-r border-line select-none">R$</span>
                <input type="number" step="0.01" className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
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
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!form.title || !form.amount}
            onClick={() => onSave({
              company_id: companyId, title: form.title, product: form.product,
              expiration_date: form.due_date ? new Date(form.due_date).toISOString() : undefined, total_amount: parseFloat(form.amount),
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

function SettleReceivableModal({ rec, onClose, onSave }: { rec: Receivable; onClose: () => void; onSave: (d: unknown) => void }) {
  const remaining = Number(rec.total_amount) - Number(rec.amount_received);
  const [mode, setMode] = useState<'total' | 'partial'>('total');
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('pix');
  const effective = mode === 'total' ? remaining : parseFloat(amount) || 0;
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
          <div className="flex gap-2">
            <button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer ${mode === 'total' ? 'bg-accent border border-accent text-white hover:opacity-90' : 'border border-line bg-bg-elev text-ink-2 hover:bg-bg-hover hover:text-ink'}`} onClick={() => setMode('total')}>Total · R$ {formatBRL(remaining)}</button>
            <button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer ${mode === 'partial' ? 'bg-accent border border-accent text-white hover:opacity-90' : 'border border-line bg-bg-elev text-ink-2 hover:bg-bg-hover hover:text-ink'}`} onClick={() => setMode('partial')}>Parcial</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor recebido</label>
              <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                <span className="flex items-center px-2.5 text-[13px] font-mono text-ink-3 bg-bg border-r border-line select-none">R$</span>
                <input className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0 disabled:opacity-60" type="number" step="0.01" value={mode === 'total' ? String(remaining) : amount} onChange={e => setAmount(e.target.value)} disabled={mode === 'total'} />
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
                <option value="boleto">Boleto</option>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave({ amount: effective, method, payment_date: new Date().toISOString() })}><Check size={14} /> Confirmar recebimento</Button>
        </div>
      </div>
    </div>
  );
}

function PayPayableModal({ payable, onClose, onSave }: { payable: Payable; onClose: () => void; onSave: (d: unknown) => void }) {
  const remaining = Number(payable.total_amount) - Number(payable.amount_paid);
  const [mode, setMode] = useState<'total' | 'partial'>('total');
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('pix');
  const effective = mode === 'total' ? remaining : parseFloat(amount) || 0;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold m-0">Pagar título</h3>
            <div className="text-[11.5px] text-ink-3 mt-0.5">{payable.id}</div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex gap-2">
            <button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer ${mode === 'total' ? 'bg-accent border border-accent text-white hover:opacity-90' : 'border border-line bg-bg-elev text-ink-2 hover:bg-bg-hover hover:text-ink'}`} onClick={() => setMode('total')}>Total · R$ {formatBRL(remaining)}</button>
            <button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer ${mode === 'partial' ? 'bg-accent border border-accent text-white hover:opacity-90' : 'border border-line bg-bg-elev text-ink-2 hover:bg-bg-hover hover:text-ink'}`} onClick={() => setMode('partial')}>Parcial</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor pago</label>
              <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                <span className="flex items-center px-2.5 text-[13px] font-mono text-ink-3 bg-bg border-r border-line select-none">R$</span>
                <input className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0 disabled:opacity-60" type="number" step="0.01" value={mode === 'total' ? String(remaining) : amount} onChange={e => setAmount(e.target.value)} disabled={mode === 'total'} />
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
                <option value="boleto">Boleto</option>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave({ amount: effective, method })}><Check size={14} /> Confirmar pagamento</Button>
        </div>
      </div>
    </div>
  );
}

function EditCompanyModal({ company, onClose, onSave }: { company: Company; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ name: company.name ?? '', cnpj: company.cnpj ?? '', email: company.email ?? '', phone: company.phone ?? '' });
  const cnpjFilled = form.cnpj.replace(/\D/g, '').length === 14;
  const cnpjValid = !cnpjFilled || validateCNPJ(form.cnpj);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3 flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">Editar empresa</h3>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Razão social / Nome</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">CNPJ</label>
            <Input className={`font-mono ${cnpjFilled && !cnpjValid ? 'border-danger focus:border-danger' : ''}`} value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: maskCNPJ(e.target.value) }))} />
            {cnpjFilled && !cnpjValid && <span className="text-[11px] text-danger">CNPJ inválido</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">E-mail</label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Telefone</label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line flex-shrink-0">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={cnpjFilled && !cnpjValid} onClick={() => onSave({ name: form.name, cnpj: form.cnpj || undefined, email: form.email || undefined, phone: form.phone || undefined })}><Check size={14} /> Salvar</Button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const companyId = Number(id);

  const { data: company, isLoading } = useQuery({ queryKey: ['company', companyId], queryFn: () => getCompany(companyId) });

  const [tab, setTab] = useState<'receivables' | 'payables'>('receivables');
  const [selectedRec, setSelectedRec] = useState<Set<number>>(new Set());
  const [selectedPay, setSelectedPay] = useState<Set<number>>(new Set());
  const [recMenu, setRecMenu] = useState<MenuState | null>(null);
  const [payMenu, setPayMenu] = useState<MenuState | null>(null);
  const [newRecModal, setNewRecModal] = useState(false);
  const [newPayModal, setNewPayModal] = useState(false);
  const [settleRec, setSettleRec] = useState<Receivable | null>(null);
  const [payPayable, setPayPayable] = useState<Payable | null>(null);
  const [editModal, setEditModal] = useState(false);

  const PAGE_SIZE = 10;
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tabPages, setTabPages] = useState<Record<string, number>>({ receivables: 1, payables: 1 });
  const setTabPage = (t: string, page: number) => setTabPages(p => ({ ...p, [t]: page }));

  useEffect(() => {
    setTabPages({ receivables: 1, payables: 1 });
  }, [dateFrom, dateTo]);

  const receivables = company?.receivables ?? [];
  const payables = company?.payables ?? [];

  const ownReceivables = receivables.filter(r => r.stakeholder === 'COMPANY' || r.stakeholder == null);

  const ownPayables = payables.filter(p => p.stakeholder === 'COMPANY' || p.stakeholder == null);

  const menuRec = recMenu ? receivables.find(r => r.id === recMenu.id) ?? null : null;
  const menuPay = payMenu ? payables.find(p => p.id === payMenu.id) ?? null : null;

  function openMenu(setter: (s: MenuState | null) => void, id: number, e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setter(s => s?.id === id ? null : { id, top: r.bottom + 4, right: window.innerWidth - r.right });
  }

  const createRecMut = useMutation({
    mutationFn: createReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setNewRecModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteRecMut = useMutation({
    mutationFn: deleteReceivable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const settleRecMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof registerPayment>[1] }) => registerPayment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSettleRec(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const createPayMut = useMutation({
    mutationFn: createPayable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['payables'] }); setNewPayModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deletePayMut = useMutation({
    mutationFn: deletePayable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['payables'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const payPayableMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => registerPayablePayment(id, data as { amount: number; method?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['payables'] }); setPayPayable(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateCompanyMut = useMutation({
    mutationFn: (data: unknown) => updateCompany(companyId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); setEditModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const bulkDeleteRecMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteReceivables(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelectedRec(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeletePayMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeletePayables(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); qc.invalidateQueries({ queryKey: ['payables'] }); setSelectedPay(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton.Block className="h-[13px] w-14 mb-1" />
          <Skeleton.Title width="w-52" />
          <Skeleton.Text width="w-64" />
        </div>
        <Skeleton.Block className="h-8 w-20 rounded-lg mt-6" />
      </div>
      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <Skeleton.Card key={i} />)}
        </div>
        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 border-b border-line"><Skeleton.Text width="w-32" /></div>
          <table className="w-full border-collapse">
            <tbody><Skeleton.TableRows cols={7} rows={5} /></tbody>
          </table>
        </div>
      </div>
    </div>
  );
  if (!company) return <div className="p-8 text-[13px] text-ink-3">Empresa não encontrada.</div>;

  const TABS = [
    { key: 'receivables' as const, label: 'Títulos a receber' },
    { key: 'payables' as const, label: 'Títulos a pagar' },
  ];

  const totalRecebido = ownReceivables.reduce((s, r) => s + Number(r.amount_received), 0);
  const totalAberto = ownReceivables.reduce((s, r) => s + Math.max(0, Number(r.total_amount) - Number(r.amount_received)), 0);
  const totalPago = ownPayables.reduce((s, p) => s + Number(p.amount_paid), 0);
  const totalAPagar = ownPayables.reduce((s, p) => s + Math.max(0, Number(p.total_amount) - Number(p.amount_paid)), 0);

  function filterDate<T>(items: T[], key: keyof T): T[] {
    if (!dateFrom && !dateTo) return items;
    return items.filter(item => {
      const val = item[key];
      if (val == null) return true;
      const d = new Date(val as string);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); if (d > end) return false; }
      return true;
    });
  }

  function pageItems<T>(items: T[], page: number): { rows: T[]; totalPages: number } {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    return { rows: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), totalPages };
  }

  const filteredOwnRec = filterDate(ownReceivables, 'created_at');
  const ownRecResult = pageItems(filteredOwnRec, tabPages.receivables);
  const filteredOwnPay = filterDate(ownPayables, 'created_at');
  const ownPayResult = pageItems(filteredOwnPay, tabPages.payables);

  const allIdsRec = ownRecResult.rows.map(r => r.id);
  const allSelectedRec = allIdsRec.length > 0 && allIdsRec.every(id => selectedRec.has(id));
  const toggleAllRec = () => setSelectedRec(allSelectedRec ? new Set() : new Set(allIdsRec));
  const toggleOneRec = (id: number) => setSelectedRec(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const allIdsPay = ownPayResult.rows.map(p => p.id);
  const allSelectedPay = allIdsPay.length > 0 && allIdsPay.every(id => selectedPay.has(id));
  const toggleAllPay = () => setSelectedPay(allSelectedPay ? new Set() : new Set(allIdsPay));
  const toggleOnePay = (id: number) => setSelectedPay(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/companies')}>
            <ChevronLeft size={15} /> Voltar
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{company.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-[12px] text-ink-3 flex-wrap">
            <span className="font-mono">{company.cnpj ?? 'CNPJ não informado'}</span>
            {company.email && <><span className="text-ink-3 select-none">·</span><span>{company.email}</span></>}
            {company.phone && <><span className="text-ink-3 select-none">·</span><span className="font-mono">{company.phone}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-6">
          <Button variant="default" onClick={() => setEditModal(true)}><Edit size={14} /> Editar</Button>
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-6">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />

        <div className="grid grid-cols-4 gap-3">
            <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success">
                <ArrowDownLeft size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 w-full">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Recebido</div>
                <div className="text-[20px] font-bold tracking-tight leading-none font-mono text-success">
                  <span className="text-[13px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(totalRecebido)}
                </div>
              </div>
            </div>
            <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn">
                <Clock size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 w-full">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">A receber</div>
                <div className="text-[20px] font-bold tracking-tight leading-none font-mono">
                  <span className="text-[13px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(totalAberto)}
                </div>
              </div>
            </div>
            <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger">
                <ArrowUpRight size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 w-full">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Pago</div>
                <div className="text-[20px] font-bold tracking-tight leading-none font-mono text-danger">
                  <span className="text-[13px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(totalPago)}
                </div>
              </div>
            </div>
            <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn">
                <Hourglass size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 w-full">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">A pagar</div>
                <div className="text-[20px] font-bold tracking-tight leading-none font-mono">
                  <span className="text-[13px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(totalAPagar)}
                </div>
              </div>
            </div>
          </div>

        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
            <div className="flex">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 whitespace-nowrap ${tab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                  style={{ borderBottomColor: tab === t.key ? 'var(--accent)' : 'transparent', marginBottom: -1 }}
                  onClick={() => setTab(t.key)}
                >{t.label}</button>
              ))}
            </div>
            <span className="flex-1" />
            {tab === 'receivables' && (
              <Button variant="primary" onClick={() => setNewRecModal(true)}><Plus size={14} /> Novo título a receber</Button>
            )}
            {tab === 'payables' && (
              <Button variant="primary" onClick={() => setNewPayModal(true)}><Plus size={14} /> Novo título a pagar</Button>
            )}
          </div>

          {tab === 'receivables' && (
            <div className="flex flex-col">
              {selectedRec.size > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                  <span className="text-[13px] font-medium text-accent-ink">{selectedRec.size} selecionado{selectedRec.size !== 1 ? 's' : ''}</span>
                  <span className="flex-1" />
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-danger border border-danger text-white cursor-pointer hover:opacity-90" onClick={() => bulkDeleteRecMut.mutate([...selectedRec])}>
                    <Trash2 size={14} /> Remover selecionados
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedRec} onChange={toggleAllRec} /></th>
                      <th className={thCls}>Título</th><th className={thCls}>Vencimento</th>
                      <th className={thNumCls}>Valor</th><th className={thNumCls}>Recebido</th><th className={thCls}>Status</th><th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownRecResult.rows.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                    {ownRecResult.rows.map(r => {
                      const st = receivableStatus(r);
                      return (
                        <tr key={r.id} className="hover:bg-bg-hover">
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
                            <Button variant="icon" onClick={e => { e.stopPropagation(); openMenu(setRecMenu, r.id, e); }}><MoreHorizontal size={15} /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.receivables} totalPages={ownRecResult.totalPages} total={filteredOwnRec.length} limit={PAGE_SIZE} onChange={p => setTabPage('receivables', p)} />
            </div>
          )}


          {tab === 'payables' && (
            <div className="flex flex-col">
              {selectedPay.size > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                  <span className="text-[13px] font-medium text-accent-ink">{selectedPay.size} selecionado{selectedPay.size !== 1 ? 's' : ''}</span>
                  <span className="flex-1" />
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-danger border border-danger text-white cursor-pointer hover:opacity-90" onClick={() => bulkDeletePayMut.mutate([...selectedPay])}>
                    <Trash2 size={14} /> Remover selecionados
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedPay} onChange={toggleAllPay} /></th>
                      <th className={thCls}>Título</th><th className={thCls}>Vencimento</th>
                      <th className={thNumCls}>Valor</th><th className={thNumCls}>Pago</th><th className={thCls}>Status</th><th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownPayResult.rows.length === 0 && <tr><td colSpan={7} className="px-3.5 py-6 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                    {ownPayResult.rows.map(p => (
                      <tr key={p.id} className="hover:bg-bg-hover">
                        <td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedPay.has(p.id)} onChange={() => toggleOnePay(p.id)} /></td>
                        <td className={tdCls}>
                          <div className="font-medium">{p.title}</div>
                          {p.product && <div className="text-[11.5px] text-ink-3 mt-0.5">{p.product}</div>}
                        </td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{p.expiration_date ? formatDate(p.expiration_date) : '—'}</td>
                        <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.total_amount)}</td>
                        <td className={`${tdCls} text-right font-mono`}>{Number(p.amount_paid) > 0 ? `R$ ${formatBRL(p.amount_paid)}` : '—'}</td>
                        <td className={tdCls}><Badge variant={STATUS_BADGE[payableStatus(p)] as BadgeVariant}>{PAYABLE_STATUS_LABEL[payableStatus(p)]}</Badge></td>
                        <td className={tdCls} onClick={e => e.stopPropagation()}>
                          <Button variant="icon" onClick={e => { e.stopPropagation(); openMenu(setPayMenu, p.id, e); }}><MoreHorizontal size={15} /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={tabPages.payables} totalPages={ownPayResult.totalPages} total={filteredOwnPay.length} limit={PAGE_SIZE} onChange={p => setTabPage('payables', p)} />
            </div>
          )}

        </div>
      </div>

      {recMenu && menuRec && (
        <RowMenu top={recMenu.top} right={recMenu.right} onClose={() => setRecMenu(null)}>
          {receivableStatus(menuRec) !== 'paid' && (
            <RowMenuItem icon={<Check size={14} />} onClick={() => { setRecMenu(null); setSettleRec(menuRec); }}>Receber</RowMenuItem>
          )}
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteRecMut.mutate(menuRec.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      )}

      {payMenu && menuPay && (
        <RowMenu top={payMenu.top} right={payMenu.right} onClose={() => setPayMenu(null)}>
          {menuPay.status !== 'PAID' && (
            <RowMenuItem icon={<Check size={14} />} onClick={() => { setPayMenu(null); setPayPayable(menuPay); }}>Pagar</RowMenuItem>
          )}
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deletePayMut.mutate(menuPay.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      )}

      {newRecModal && <NewReceivableModal companyId={companyId} onClose={() => setNewRecModal(false)} onSave={d => createRecMut.mutate(d)} />}
      {newPayModal && <NewPayableModal companyId={companyId} onClose={() => setNewPayModal(false)} onSave={d => createPayMut.mutate(d)} />}
      {settleRec && <SettleReceivableModal rec={settleRec} onClose={() => setSettleRec(null)} onSave={d => settleRecMut.mutate({ id: settleRec.id, data: d as Parameters<typeof registerPayment>[1] })} />}
      {payPayable && <PayPayableModal payable={payPayable} onClose={() => setPayPayable(null)} onSave={d => payPayableMut.mutate({ id: payPayable.id, data: d })} />}
      {editModal && company && <EditCompanyModal company={company} onClose={() => setEditModal(false)} onSave={d => updateCompanyMut.mutate(d)} />}
    </div>
  );
}
