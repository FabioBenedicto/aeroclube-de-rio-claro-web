import { useState, useRef } from 'react';
import DateInput from '../../components/DateInput';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Eye, Trash2, Check as CheckIcon, X, Paperclip, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { getBills, createBill, deleteBill, uploadBillNotaFiscal, deleteBillNotaFiscal } from '../../api/invoices';
import { getCustomers } from '../../api/customers';
import { getReceivables } from '../../api/receivables';
import { formatBRL, formatDate, receivableStatus, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import type { Bill, Customer, Receivable } from '../../types';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Badge from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
import Pagination from '../../components/Pagination';
import { toast, extractErrorMessage } from '../../utils/toast';

const UPLOADS_BASE = 'http://localhost:3001';

type MenuState = { id: number; top: number; right: number };

const modalBase = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
const modalHead = 'flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3';
const modalFoot = 'flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line';
const sel = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] cursor-pointer';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

function NewInvoiceModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (d: { customer_id: number; items: { receivable_id: number; amount: number }[]; payment_method?: string; due_date?: string }) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [method, setMethod] = useState('PIX');
  const [dueDate, setDueDate] = useState('');

  const { data: customersData } = useQuery({ queryKey: ['customers', '', 'all', 1], queryFn: () => getCustomers(undefined, undefined, 1, 9999) });
  const customers = customersData?.data ?? [];

  const { data: receivablesData } = useQuery({ queryKey: ['receivables', 'all', '', 1], queryFn: () => getReceivables(undefined, undefined, 1, 9999), enabled: !!selectedCustomer });
  const receivables = receivablesData?.data ?? [];

  const openRecs = receivables.filter((r: Receivable) => selectedCustomer && r.client_id === selectedCustomer.id && receivableStatus(r) !== 'paid');
  const total = Object.entries(selected).reduce((s, [, v]) => s + v, 0);

  function toggleRec(r: Receivable) {
    const remaining = Number(r.total_amount) - Number(r.amount_received);
    setSelected(s => s[r.id] !== undefined
      ? Object.fromEntries(Object.entries(s).filter(([k]) => Number(k) !== r.id))
      : { ...s, [r.id]: remaining });
  }

  return (
    <div className={modalBase} onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[520px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0">Nova fatura</h3>
            <div className="flex items-center gap-1.5">
              {(['Cliente', 'Títulos', 'Pagamento'] as const).map((label, i) => {
                const n = (i + 1) as 1 | 2 | 3;
                return (
                  <span key={n} className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${step === n ? 'bg-accent text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                    <span className="text-[11px] text-ink-3">{label}</span>
                    {i < 2 && <ChevronRight size={12} className="text-ink-3" />}
                  </span>
                );
              })}
            </div>
          </div>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {step === 1 && (
          <>
            <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Selecionar cliente</label>
                <select className={sel} value={selectedCustomer?.id ?? ''} onChange={e => { const c = customers.find((x: Customer) => x.id === Number(e.target.value)) ?? null; setSelectedCustomer(c); setSelected({}); }}>
                  <option value="">Selecione</option>
                  {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className={modalFoot}>
              <button className={btnCancel} onClick={onClose}>Cancelar</button>
              <button className={btnPrimary} disabled={!selectedCustomer} onClick={() => setStep(2)}>Próximo <ChevronRight size={14} /></button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="overflow-y-auto flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line w-9"></th>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Título</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Recebido</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">A incluir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openRecs.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título em aberto.</td></tr>}
                    {openRecs.map((r: Receivable) => {
                      const remaining = Number(r.total_amount) - Number(r.amount_received);
                      const checked = r.id in selected;
                      return (
                        <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => toggleRec(r)}>
                          <td className="px-3.5 py-2.5 border-b border-line w-9"><Checkbox checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} /></td>
                          <td className="px-3.5 py-2.5 border-b border-line">{r.title}</td>
                          <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(r.total_amount)}</td>
                          <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                          <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">
                            {checked ? (
                              <input type="number" step="0.01" min="0.01" max={remaining}
                                className="w-[90px] px-1.5 py-0.5 border border-line rounded bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent text-right"
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
            </div>
            <div className={modalFoot}>
              <button className={btnCancel} onClick={() => setStep(1)}><ChevronLeft size={14} /> Voltar</button>
              <button className={btnPrimary} disabled={Object.keys(selected).length === 0 || total <= 0} onClick={() => setStep(3)}>
                Próximo <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
                  <select className={sel} value={method} onChange={e => setMethod(e.target.value)}>
                    <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Cheque</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Vencimento <span className="text-ink-3 font-normal">(opcional)</span></label>
                  <DateInput value={dueDate} onChange={setDueDate} />
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-bg-sunk border border-line rounded-lg">
                <span className="text-[12px] text-ink-3 font-medium">Total da fatura</span>
                <span className="font-mono font-semibold text-[14px]">R$ {formatBRL(total)}</span>
              </div>
            </div>
            <div className={modalFoot}>
              <button className={btnCancel} onClick={() => setStep(2)}><ChevronLeft size={14} /> Voltar</button>
              <button className={btnPrimary} onClick={() => onSave({ customer_id: selectedCustomer!.id, payment_method: method, ...(dueDate && { due_date: dueDate }), items: Object.entries(selected).map(([id, amount]) => ({ receivable_id: Number(id), amount })) })}>
                <CheckIcon size={14} /> Gerar fatura
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const lbl = 'text-[12px] font-medium text-ink-2';

export default function Invoices() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['bills', page, dateFrom, dateTo], queryFn: () => getBills(page, 20, dateFrom || undefined, dateTo || undefined) });
  const bills = data?.data ?? [];
  const [newModal, setNewModal] = useState(false);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const nfBillId = useRef<number | null>(null);

  const createMut = useMutation({ mutationFn: createBill, onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); setNewModal(false); }, onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const deleteMut = useMutation({ mutationFn: deleteBill, onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['receivables'] }); }, onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deleteBill(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const uploadNfMut = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadBillNotaFiscal(id, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); setMenuState(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteNfMut = useMutation({
    mutationFn: (id: number) => deleteBillNotaFiscal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); setMenuState(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const allIds = bills.map((x: Bill) => x.id);
  const allSelected = allIds.length > 0 && allIds.every((id: number) => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Faturas</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Agrupamento de títulos para pagamento</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className={btnPrimary} onClick={() => setNewModal(true)}><Plus size={14} /> Nova fatura</button>
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-end">
        <span className={lbl + ' whitespace-nowrap'}>Criado em</span>
        <div className="flex items-center gap-2">
          <span className={lbl + ' whitespace-nowrap'}>de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
        </div>
        <div className="flex items-center gap-2">
          <span className={lbl + ' whitespace-nowrap'}>Até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
        </div>
        <button className={btnPrimary} onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</button>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        {isLoading ? <div className="py-8 text-center text-[13px] text-ink-3">Carregando…</div> : (
          <>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
                <span className="flex-1" />
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-danger border border-danger text-white cursor-pointer hover:opacity-90" onClick={() => bulkDeleteMut.mutate([...selected])}>
                  <Trash2 size={14} /> Remover selecionados
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line w-9"><Checkbox checked={allSelected} onChange={toggleAll} /></th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">ID</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Cliente</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Criado em</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Vencimento</th>
                    <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Status</th>
                    <th className="px-3.5 py-2.5 bg-bg border-b border-line w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b: Bill) => (
                    <tr key={b.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/invoices/${b.id}`)}>
                      <td className="px-3.5 py-2.5 border-b border-line w-9" onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(b.id)} onChange={() => toggleOne(b.id)} /></td>
                      <td className="px-3.5 py-2.5 border-b border-line font-mono text-[11.5px]">{b.id}</td>
                      <td className="px-3.5 py-2.5 border-b border-line font-medium text-ink">{b.customer?.name ?? `${b.customer_id}`}</td>
                      <td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{formatDate(b.issue_date)}</td>
                      <td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{formatDate(b.due_date)}</td>
                      <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(b.total_amount)}</td>
                      <td className="px-3.5 py-2.5 border-b border-line">
                        <Badge variant={BILL_STATUS_BADGE[b.status]}>{BILL_STATUS_LABEL[b.status]}</Badge>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-line w-10" onClick={e => e.stopPropagation()}>
                        <button className={iconBtn} onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuState(s => s?.id === b.id ? null : { id: b.id, top: r.bottom + 4, right: window.innerWidth - r.right }); }}><MoreHorizontal size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && <tr><td colSpan={8} className="px-3.5 py-8 text-center text-ink-3">Nenhuma fatura encontrada.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
          </>
        )}
      </div>

      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f && nfBillId.current != null) uploadNfMut.mutate({ id: nfBillId.current, file: f });
          e.target.value = '';
        }}
      />

      {menuState && (() => { const b = bills.find((x: Bill) => x.id === menuState.id); return b ? (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => navigate(`/invoices/${b.id}`)}><Eye size={14} /> Ver detalhes</button>
          {b.status === 'open' && (
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(b.id)}><Trash2 size={14} /> Deletar</button>
          )}
          <RowMenuSep />
          {b.nota_fiscal_path ? (
            <>
              <a href={`${UPLOADS_BASE}${b.nota_fiscal_path}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer hover:bg-bg-hover text-left no-underline" onClick={() => setMenuState(null)}>
                <ExternalLink size={14} /> Ver NF
              </a>
              <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteNfMut.mutate(b.id)}>
                <Trash2 size={14} /> Remover NF
              </button>
            </>
          ) : (
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => { nfBillId.current = b.id; fileRef.current?.click(); }}>
              <Paperclip size={14} /> Anexar NF
            </button>
          )}
        </RowMenu>
      ) : null; })()}

      {newModal && <NewInvoiceModal onClose={() => setNewModal(false)} onSave={d => createMut.mutate(d)} />}
    </div>
  );
}
