import { useState, useRef } from 'react';
import DateInput from '../../components/DateInput';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Eye, Trash2, Paperclip, ExternalLink } from 'lucide-react';
import { getBills, createBill, deleteBill, uploadBillNotaFiscal, deleteBillNotaFiscal } from '../../api/invoices';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import type { Bill } from '../../types';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Badge from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
import Pagination from '../../components/Pagination';
import { toast, extractErrorMessage } from '../../utils/toast';
import { NewInvoiceModal } from './NewInvoiceModal';

const UPLOADS_BASE = 'http://localhost:3001';

type MenuState = { id: number; top: number; right: number };

const lbl = 'text-[12px] font-medium text-ink-2';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

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
