import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, BarChart3, ArrowDownLeft, Clock, AlertCircle } from 'lucide-react';
import { getReceivables, createReceivable, updateReceivable, deleteReceivable, bulkDeleteReceivables } from '../../api/receivables';
import Checkbox from '../../components/ui/Checkbox';
import { getPeoples } from '../../api/peoples';
import { getPlanes } from '../../api/planes';
import { getCompanies } from '../../api/companies';
import { formatBRL, formatDate, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import type { Receivable, Plane, People, Company } from '../../types';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';
import { toast, extractErrorMessage } from '../../utils/toast';
import { NewReceivableModal } from './NewReceivableModal';
import { EditReceivableModal } from './EditReceivableModal';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DateRangeFilter from '../../components/DateRangeFilter';
import StatCard from '../../components/ui/StatCard';
import SearchInput from '../../components/ui/SearchInput';
import TabBar, { type Tab } from '../../components/ui/TabBar';
import ProgressBar from '../../components/ui/ProgressBar';

type NamedOption = { id: number; name: string };

const TABS: Tab[] = [
  { key: undefined, label: 'Todos' },
  { key: 'PENDING', label: 'A receber' },
  { key: 'PARTIAL', label: 'Parcial' },
  { key: 'PAID', label: 'Pagos' },
  { key: 'overdue', label: 'Vencidos' },
];
type MenuState = { id: number; top: number; right: number };

export default function Receivables() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [editRec, setEditRec] = useState<Receivable | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [tab, debouncedSearch, dateFrom, dateTo]);

  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const customers = customersData?.data ?? [];

  const { data: planesData } = useQuery({ queryKey: ['planes', 1], queryFn: () => getPlanes(1, 9999) });
  const planes: Plane[] = planesData?.data ?? [];

  const { data: instructorData } = useQuery({ queryKey: ['peoples', '', 'instructor', 1], queryFn: () => getPeoples(undefined, 'instructor', 1, 9999) });
  const instructors: NamedOption[] = (instructorData?.data ?? [])
    .filter((c: People) => c.instructors != null)
    .map((c: People) => ({ id: c.instructors!.id, name: c.name }));

  const { data: partnerData } = useQuery({ queryKey: ['peoples', '', 'partner', 1], queryFn: () => getPeoples(undefined, 'partner', 1, 9999) });
  const partners: NamedOption[] = (partnerData?.data ?? [])
    .filter((c: People) => c.partners != null)
    .map((c: People) => ({ id: c.partners!.id, name: c.name }));

  const { data: employeeData } = useQuery({ queryKey: ['peoples', '', 'employee', 1], queryFn: () => getPeoples(undefined, 'employee', 1, 9999) });
  const employees: NamedOption[] = (employeeData?.data ?? [])
    .filter((c: People) => c.employees != null)
    .map((c: People) => ({ id: c.employees!.id, name: c.name }));

  const { data: studentData } = useQuery({ queryKey: ['peoples', '', 'student', 1], queryFn: () => getPeoples(undefined, 'student', 1, 9999) });
  const students: NamedOption[] = (studentData?.data ?? [])
    .filter((c: People) => c.students != null)
    .map((c: People) => ({ id: c.students!.id, name: c.name }));

  const { data: companiesData } = useQuery({ queryKey: ['companies', '', 1], queryFn: () => getCompanies(undefined, 1, 9999) });
  const companies: Company[] = companiesData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['receivables', tab, debouncedSearch, dateFrom, dateTo, page],
    queryFn: () => getReceivables(tab, debouncedSearch || undefined, dateFrom || undefined, dateTo || undefined, page),
  });
  const allRecs = data?.data ?? [];

  const deleteMut = useMutation({ mutationFn: deleteReceivable, onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }), onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteReceivables(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const menuRec = menuState ? allRecs.find(r => r.id === menuState.id) ?? null : null;

  const { data: kpiData } = useQuery({ queryKey: ['receivables', 'kpi', dateFrom, dateTo], queryFn: () => getReceivables(undefined, undefined, dateFrom || undefined, dateTo || undefined, 1, 9999) });
  const kpiRecs = kpiData?.data ?? [];
  const total = kpiRecs.reduce((a, r) => a + Number(r.total_amount), 0);
  const received = kpiRecs.reduce((a, r) => a + Number(r.amount_received), 0);
  const overdue = kpiRecs.filter(r => receivableStatus(r) === 'overdue').reduce((a, r) => a + Number(r.total_amount) - Number(r.amount_received), 0);

  const allIds = allRecs.map(r => r.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: TableColumn<Receivable>[] = [
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
      render: row => row.title,
    },
    {
      key: 'receivable_type',
      label: 'Tipo',
      render: row => row.receivable_type?.name ? <Chip>{row.receivable_type.name}</Chip> : '—',
    },
    {
      key: 'payer',
      label: 'Pagador',
      render: row => {
        const name = row.people?.name
          ?? row.person?.name
          ?? row.company?.name
          ?? row.instructor?.people?.name ?? row.instructor?.customer?.name
          ?? row.partner?.people?.name ?? row.partner?.customer?.name
          ?? row.employee?.people?.name ?? row.employee?.customer?.name
          ?? '—';
        const link = row.stakeholder === 'COMPANY' ? `/companies/${row.company_id}`
          : row.stakeholder === 'INSTRUCTOR' ? `/peoples/${row.instructor?.customer_id}`
          : row.stakeholder === 'PARTNER' ? `/peoples/${row.partner?.customer_id}`
          : row.stakeholder === 'EMPLOYEE' ? `/peoples/${row.employee?.customer_id}`
          : (row.people_id ?? row.person_id) ? `/peoples/${row.people_id ?? row.person_id}`
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
      key: 'expiration_date',
      label: 'Vencimento',
      render: row => <span className="font-mono text-[12px]">{formatDate(row.expiration_date)}</span>,
    },
    {
      key: 'total_amount',
      label: 'Valor',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => `R$ ${formatBRL(row.total_amount)}`,
    },
    {
      key: 'amount_received',
      label: 'Recebido',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => `R$ ${formatBRL(row.amount_received)}`,
    },
    {
      key: 'progress',
      label: 'Progresso',
      headerClassName: 'min-w-[120px]',
      render: row => {
        const st = receivableStatus(row);
        const pct = Number(row.total_amount) > 0 ? Math.round((Number(row.amount_received) / Number(row.total_amount)) * 100) : 0;
        return <ProgressBar pct={pct} isPaid={st === 'paid'} />;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: row => {
        const st = receivableStatus(row);
        return <Badge variant={STATUS_BADGE[st] as 'success' | 'warn' | 'danger' | 'accent' | 'default'}>{STATUS_LABEL[st]}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-10',
      cellClassName: 'w-10',
      stopPropagation: true,
      render: row => (
        <Button variant="icon" onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuState(s => s?.id === row.id ? null : { id: row.id, top: rect.bottom + 4, right: window.innerWidth - rect.right }); }}>
          <MoreHorizontal size={15} />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Títulos a receber"
        description="Títulos gerados por voos, mensalidades e serviços"
        action={can(PERMISSIONS.RECEIVABLES.CREATE) ? (
          <Button variant="primary" onClick={() => setNewModal(true)}><Plus size={14} /> Novo título</Button>
        ) : undefined}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />

        <div className="grid grid-cols-4 gap-3">
          <StatCard icon={<BarChart3 size={18} />} iconVariant="default" label="Valor total" value={formatBRL(total)} prefix="R$" />
          <StatCard icon={<ArrowDownLeft size={18} />} iconVariant="success" label="Valor recebido" value={formatBRL(received)} prefix="R$" valueVariant="success" />
          <StatCard icon={<Clock size={18} />} iconVariant="warn" label="Valor a receber" value={formatBRL(total - received)} prefix="R$" valueVariant="warn" />
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
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título ou pagador" minWidth={250} />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
              <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
              <span className="flex-1" />
              {can(PERMISSIONS.RECEIVABLES.DELETE) && (
                <Button variant="danger" onClick={() => bulkDeleteMut.mutate([...selected])}>
                  <Trash2 size={14} /> Remover selecionados
                </Button>
              )}
            </div>
          )}

          <Table
            columns={columns}
            data={allRecs}
            keyField="id"
            onRowClick={r => navigate(`/receivables/${r.id}`)}
            emptyMessage="Nenhum título encontrado."
            isLoading={isLoading}
          />
          <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
        </div>
      </div>

      {menuState && menuRec && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => { setMenuState(null); navigate(`/receivables/${menuRec.id}`); }}>Ver detalhes</RowMenuItem>
          {can(PERMISSIONS.RECEIVABLES.UPDATE) && <RowMenuItem icon={<Edit size={14} />} onClick={() => setEditRec(menuRec)}>Editar</RowMenuItem>}
          {can(PERMISSIONS.RECEIVABLES.DELETE) && <><RowMenuSep /><RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuRec.id)}>Remover</RowMenuDangerItem></>}
        </RowMenu>
      )}

      {newModal && <NewReceivableModal customers={customers} students={students} instructors={instructors} partners={partners} employees={employees} planes={planes} companies={companies} onClose={() => setNewModal(false)} onSave={d => createReceivable(d).then(() => { qc.invalidateQueries({ queryKey: ['receivables'] }); setNewModal(false); }).catch((e: unknown) => toast.error(extractErrorMessage(e)))} />}
      {editRec && <EditReceivableModal rec={editRec} onClose={() => setEditRec(null)} onSave={d => updateReceivable(editRec.id, d).then(() => { qc.invalidateQueries({ queryKey: ['receivables'] }); setEditRec(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)))} />}
    </div>
  );
}
