import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Trash2, Check as CheckIcon, Eye, Pencil, BarChart3, ArrowUpRight, Hourglass, AlertCircle } from 'lucide-react';
import { getPayables, createPayable, updatePayable, deletePayable, bulkDeletePayables, registerPayablePayment } from '../../api/payables';
import Checkbox from '../../components/ui/Checkbox';
import PayModal from '../../components/PayModal';
import { getPeoples } from '../../api/peoples';
import { getPlanes } from '../../api/planes';
import { getCompanies } from '../../api/companies';
import { formatBRL, formatDate, payableStatus, STATUS_BADGE, PAYABLE_STATUS_LABEL } from '../../utils/format';
import type { Payable, Plane, People, Company } from '../../types';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { toast, extractErrorMessage } from '../../utils/toast';
import { NewPayableModal } from './NewPayableModal';
import { EditPayableModal } from './EditPayableModal';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DateRangeFilter from '../../components/DateRangeFilter';
import StatCard from '../../components/ui/StatCard';
import SearchInput from '../../components/ui/SearchInput';
import TabBar, { type Tab } from '../../components/ui/TabBar';
import ProgressBar from '../../components/ui/ProgressBar';

type NamedOption = { id: number; name: string };
type MenuState = { id: number; top: number; right: number };

const TABS: Tab[] = [
  { key: undefined, label: 'Todos' },
  { key: 'PENDING', label: 'A pagar' },
  { key: 'PARTIAL', label: 'Parcial' },
  { key: 'PAID', label: 'Pagos' },
  { key: 'overdue', label: 'Vencidos' },
];

export default function Payables() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [editPayable, setEditPayable] = useState<Payable | null>(null);
  const [payPayable, setPayPayable] = useState<Payable | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => { setPage(1); }, [tab, search, dateFrom, dateTo]);

  const { data, isLoading } = useQuery({
    queryKey: ['payables', tab, search, dateFrom, dateTo, page],
    queryFn: () => getPayables(tab, page, 20, undefined, search || undefined, dateFrom || undefined, dateTo || undefined),
  });
  const payables = data?.data ?? [];

  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const customers = customersData?.data ?? [];
  const { data: planesData } = useQuery({ queryKey: ['planes', 1], queryFn: () => getPlanes(1, 9999) });
  const planes: Plane[] = planesData?.data ?? [];

  const { data: instructorData } = useQuery({ queryKey: ['peoples', '', 'instructor', 1], queryFn: () => getPeoples(undefined, 'instructor', 1, 9999) });
  const instructors: NamedOption[] = (instructorData?.data ?? [])
    .filter((c: People) => c.instructors?.length > 0)
    .map((c: People) => ({ id: c.instructors[0].id, name: c.name }));

  const { data: partnerData } = useQuery({ queryKey: ['peoples', '', 'partner', 1], queryFn: () => getPeoples(undefined, 'partner', 1, 9999) });
  const partners: NamedOption[] = (partnerData?.data ?? [])
    .filter((c: People) => c.partners?.length > 0)
    .map((c: People) => ({ id: c.partners[0].id, name: c.name }));

  const { data: employeeData } = useQuery({ queryKey: ['peoples', '', 'employee', 1], queryFn: () => getPeoples(undefined, 'employee', 1, 9999) });
  const employees: NamedOption[] = (employeeData?.data ?? [])
    .filter((c: People) => (c.employees ?? []).length > 0)
    .map((c: People) => ({ id: c.employees![0].id, name: c.name }));

  const { data: studentData } = useQuery({ queryKey: ['peoples', '', 'student', 1], queryFn: () => getPeoples(undefined, 'student', 1, 9999) });
  const students: NamedOption[] = (studentData?.data ?? [])
    .filter((c: People) => c.students != null)
    .map((c: People) => ({ id: c.students!.id, name: c.name }));

  const { data: companiesData } = useQuery({ queryKey: ['companies', '', 1], queryFn: () => getCompanies(undefined, 1, 9999) });
  const companies: Company[] = companiesData?.data ?? [];

  const deleteMut = useMutation({ mutationFn: deletePayable, onSuccess: () => qc.invalidateQueries({ queryKey: ['payables'] }), onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const updateMut = useMutation({
    mutationFn: (d: unknown) => updatePayable(editPayable!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables'] }); setEditPayable(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeletePayables(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const payMut = useMutation({
    mutationFn: (d: unknown) => registerPayablePayment(payPayable!.id, d as { amount: number; method?: string; paid_at?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payables'] }); setPayPayable(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuPayable = menuState ? payables.find(p => p.id === menuState.id) ?? null : null;

  const { data: kpiData } = useQuery({ queryKey: ['payables', 'kpi', dateFrom, dateTo], queryFn: () => getPayables(undefined, 1, 9999, undefined, undefined, dateFrom || undefined, dateTo || undefined) });
  const allP = kpiData?.data ?? [];
  const total = allP.reduce((a, p) => a + Number(p.total_amount), 0);
  const paid = allP.reduce((a, p) => a + Number(p.amount_paid), 0);
  const overdue = allP.filter(p => p.status !== 'PAID' && p.expiration_date && new Date(p.expiration_date) < new Date()).reduce((a, p) => a + Number(p.total_amount) - Number(p.amount_paid), 0);

  const allIds = payables.map(p => p.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: TableColumn<Payable>[] = [
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
      key: 'title',
      label: 'Título',
      render: row => <span className="font-medium text-ink">{row.title}</span>,
    },
    {
      key: 'product',
      label: 'Tipo',
      render: row => row.payable_type?.name ? <Chip>{row.payable_type.name}</Chip> : '—',
    },
    {
      key: 'payer',
      label: 'Recebedor',
      render: row => {
        const name = row.people?.name ?? row.company?.name
          ?? row.instructor?.people?.name ?? row.instructor?.customer?.name
          ?? row.partner?.people?.name ?? row.partner?.customer?.name
          ?? row.employee?.people?.name ?? row.employee?.customer?.name
          ?? '—';
        const link = row.stakeholder === 'COMPANY' ? `/companies/${row.company_id}`
          : row.stakeholder === 'INSTRUCTOR' ? `/peoples/${row.instructor?.customer_id}`
          : row.stakeholder === 'PARTNER' ? `/peoples/${row.partner?.customer_id}`
          : row.stakeholder === 'EMPLOYEE' ? `/peoples/${row.employee?.customer_id}`
          : (row.person_id ?? row.people?.id) ? `/peoples/${row.person_id ?? row.people!.id}`
          : null;
        if (!link) return <span className="text-[12px] text-ink-3">{name}</span>;
        return (
          <button
            className="text-[12px] text-ink-3 hover:text-accent hover:underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0 text-left"
            onClick={e => { e.stopPropagation(); navigate(link); }}
          >
            {name}
          </button>
        );
      },
    },
    {
      key: 'due_date',
      label: 'Vencimento',
      render: row => <span className="font-mono text-[12px]">{row.expiration_date ? formatDate(row.expiration_date) : '—'}</span>,
    },
    {
      key: 'amount',
      label: 'Valor',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => `R$ ${formatBRL(row.total_amount)}`,
    },
    {
      key: 'amount_paid',
      label: 'Pago',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => `R$ ${formatBRL(row.amount_paid)}`,
    },
    {
      key: 'progress',
      label: 'Progresso',
      headerClassName: 'w-32',
      cellClassName: 'w-32',
      render: row => {
        const st = payableStatus(row);
        const pct = Number(row.total_amount) > 0 ? Math.round((Number(row.amount_paid) / Number(row.total_amount)) * 100) : 0;
        return <ProgressBar pct={pct} isPaid={st === 'paid'} />;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: row => (
        <Badge variant={STATUS_BADGE[payableStatus(row)] as 'success' | 'warn' | 'danger' | 'accent' | 'default'}>{PAYABLE_STATUS_LABEL[payableStatus(row)]}</Badge>
      ),
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
        title="Títulos a pagar"
        description="Títulos a pagar a instrutores e fornecedores"
        action={can(PERMISSIONS.PAYABLES.CREATE) ? (
          <Button variant="primary" onClick={() => setNewModal(true)}><Plus size={14} /> Novo título</Button>
        ) : undefined}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />

        <div className="grid grid-cols-4 gap-3">
          <StatCard icon={<BarChart3 size={18} />} iconVariant="default" label="Valor total" value={formatBRL(total)} prefix="R$" />
          <StatCard icon={<ArrowUpRight size={18} />} iconVariant="danger" label="Valor pago" value={formatBRL(paid)} prefix="R$" valueVariant="danger" />
          <StatCard icon={<Hourglass size={18} />} iconVariant="warn" label="Valor a pagar" value={formatBRL(total - paid)} prefix="R$" valueVariant="warn" />
          <StatCard icon={<AlertCircle size={18} />} iconVariant="danger" label="Valor vencido" value={formatBRL(overdue)} prefix="R$" valueVariant="danger" />
        </div>

        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
            <div className="flex items-center">
              <div className="px-3.5 py-2 flex items-center">
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </div>
              <TabBar tabs={TABS} active={tab} onChange={setTab} />
            </div>
            <div className="flex-1" />
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar por título ou recebedor" minWidth={260} />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
              <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
              <span className="flex-1" />
              {can(PERMISSIONS.PAYABLES.DELETE) && (
                <Button variant="danger" onClick={() => bulkDeleteMut.mutate([...selected])}>
                  <Trash2 size={14} /> Remover selecionados
                </Button>
              )}
            </div>
          )}

          <Table
            columns={columns}
            data={payables}
            keyField="id"
            onRowClick={p => navigate(`/payables/${p.id}`)}
            emptyMessage="Nenhum título encontrado."
            isLoading={isLoading}
          />
          <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
        </div>
      </div>

      {menuState && menuPayable && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => { setMenuState(null); navigate(`/payables/${menuPayable.id}`); }}>Ver detalhes</RowMenuItem>
          {can(PERMISSIONS.PAYABLES.UPDATE) && <RowMenuItem icon={<Pencil size={14} />} onClick={() => { setMenuState(null); setEditPayable(menuPayable); }}>Editar</RowMenuItem>}
          {menuPayable.status !== 'PAID' && can(PERMISSIONS.PAYABLES.UPDATE) && <RowMenuItem icon={<CheckIcon size={14} />} onClick={() => setPayPayable(menuPayable)}>Pagar</RowMenuItem>}
          {can(PERMISSIONS.PAYABLES.DELETE) && <><RowMenuSep /><RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuPayable.id)}>Remover</RowMenuDangerItem></>}
        </RowMenu>
      )}

      {newModal && <NewPayableModal customers={customers} students={students} instructors={instructors} partners={partners} employees={employees} planes={planes} companies={companies} onClose={() => setNewModal(false)} onSave={d => createPayable(d).then(() => { qc.invalidateQueries({ queryKey: ['payables'] }); setNewModal(false); }).catch((e: unknown) => toast.error(extractErrorMessage(e)))} />}
      {editPayable && <EditPayableModal payable={editPayable} onClose={() => setEditPayable(null)} onSave={d => updateMut.mutate(d)} />}
      {payPayable && <PayModal payable={payPayable} onClose={() => setPayPayable(null)} onSave={d => payMut.mutate(d)} />}
    </div>
  );
}
