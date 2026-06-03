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
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

const UPLOADS_BASE = 'http://localhost:3001';

type MenuState = { id: number; top: number; right: number };

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

  const columns: TableColumn<Bill>[] = [
    {
      key: 'checkbox',
      label: '',
      headerClassName: 'w-9',
      cellClassName: 'w-9',
      stopPropagation: true,
      render: row => <Checkbox checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} />,
    },
    {
      key: 'id',
      label: 'ID',
      render: row => <span className="font-mono text-[11.5px]">{row.id}</span>,
    },
    {
      key: 'customer',
      label: 'Cliente',
      render: row => <span className="font-medium text-ink">{row.customer?.name ?? `${row.customer_id}`}</span>,
    },
    {
      key: 'issue_date',
      label: 'Criado em',
      render: row => <span className="font-mono text-[12px]">{formatDate(row.issue_date)}</span>,
    },
    {
      key: 'due_date',
      label: 'Vencimento',
      render: row => <span className="font-mono text-[12px]">{formatDate(row.due_date)}</span>,
    },
    {
      key: 'total_amount',
      label: 'Valor',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => `R$ ${formatBRL(row.total_amount)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: row => <Badge variant={BILL_STATUS_BADGE[row.status]}>{BILL_STATUS_LABEL[row.status]}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-10',
      cellClassName: 'w-10',
      stopPropagation: true,
      render: row => (
        <Button variant="icon" onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuState(s => s?.id === row.id ? null : { id: row.id, top: r.bottom + 4, right: window.innerWidth - r.right }); }}>
          <MoreHorizontal size={15} />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Faturas"
        description="Agrupamento de títulos para pagamento"
        action={<Button variant="primary" onClick={() => setNewModal(true)}><Plus size={14} /> Nova fatura</Button>}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-end">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Criado em</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
        </div>
        <Button variant="primary" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</Button>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
            <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <span className="flex-1" />
            <Button variant="danger" onClick={() => bulkDeleteMut.mutate([...selected])}>
              <Trash2 size={14} /> Remover selecionados
            </Button>
          </div>
        )}

        <div className="px-3.5 py-2.5 border-b border-line bg-bg flex items-center">
          <Checkbox checked={allSelected} onChange={toggleAll} />
        </div>

        <Table
          columns={columns}
          data={bills}
          keyField="id"
          onRowClick={b => navigate(`/invoices/${b.id}`)}
          emptyMessage="Nenhuma fatura encontrada."
          isLoading={isLoading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
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
