import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Eye, Trash2, CreditCard } from 'lucide-react';
import { getBills, createBill, payBill, deleteBill, bulkDeleteBills } from '../../api/invoices';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import type { Bill } from '../../types';
import RowMenu, { RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import Badge from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
import Pagination from '../../components/Pagination';
import { toast, extractErrorMessage } from '../../utils/toast';
import { NewInvoiceModal } from './NewInvoiceModal';
import { PayInvoiceModal } from './PayInvoiceModal';
import { CnabBaixaModal } from './CnabBaixaModal';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DateRangeFilter from '../../components/DateRangeFilter';

const UPLOADS_BASE = 'http://localhost:3001';

type MenuState = { id: number; top: number; right: number };

export default function Invoices() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['bills', page, dateFrom, dateTo], queryFn: () => getBills(page, 20, dateFrom || undefined, dateTo || undefined) });
  const bills = data?.data ?? [];
  const [newModal, setNewModal] = useState(false);
  const [payBillId, setPayBillId] = useState<number | null>(null);
  const [baixaBillId, setBaixaBillId] = useState<number | null>(null);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const createMut = useMutation({
    mutationFn: createBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); setNewModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const payMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { payment_method: string; payment_date: string; use_credit?: boolean } }) => payBill(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setPayBillId(null); setBaixaBillId(null); setMenuState(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteMut = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['receivables'] }); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteBills(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setSelected(new Set()); },
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
      render: row => <span className="font-medium text-ink">{row.people?.name ?? `#${row.people_id}`}</span>,
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: row => <span className="font-mono text-[12px]">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'expiration_date',
      label: 'Vencimento',
      render: row => <span className="font-mono text-[12px]">{row.expiration_date ? formatDate(row.expiration_date) : '—'}</span>,
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
        <DateRangeFilter label="Criado em" onApply={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }} />

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

      {menuState && (() => { const b = bills.find((x: Bill) => x.id === menuState.id); return b ? (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/invoices/${b.id}`)}>Ver detalhes</RowMenuItem>
          {b.status === 'open' && (
            <RowMenuItem icon={<CreditCard size={14} />} onClick={() => { setPayBillId(b.id); setMenuState(null); }}>Receber</RowMenuItem>
          )}
          {b.status === 'pending_cnab' && (
            <RowMenuItem icon={<CreditCard size={14} />} onClick={() => { setBaixaBillId(b.id); setMenuState(null); }}>Dar baixa</RowMenuItem>
          )}
          {b.status === 'open' && (
            <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(b.id)}>Deletar</RowMenuDangerItem>
          )}
        </RowMenu>
      ) : null; })()}

      {newModal && <NewInvoiceModal onClose={() => setNewModal(false)} onSave={d => createMut.mutate(d)} />}
      {payBillId && <PayInvoiceModal billId={payBillId} creditBalance={bills.find((b: Bill) => b.id === payBillId)?.people?.credit_balance} onClose={() => setPayBillId(null)} onSave={data => payMut.mutate({ id: payBillId, data })} />}
      {baixaBillId && <CnabBaixaModal billId={baixaBillId} totalAmount={bills.find((b: Bill) => b.id === baixaBillId)?.total_amount} isPending={payMut.isPending} onClose={() => setBaixaBillId(null)} onSave={data => payMut.mutate({ id: baixaBillId, data })} />}
    </div>
  );
}
