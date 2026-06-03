import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, MoreHorizontal, Edit, Trash2, Check as CheckIcon } from 'lucide-react';
import { getFlights, getFlight, createFlight, updateFlight, closeFlight, deleteFlight } from '../../api/flights';
import { getPeoples } from '../../api/peoples';
import { getPlanes } from '../../api/planes';
import { formatDate, formatBRL, formatHours } from '../../utils/format';
import DateInput from '../../components/DateInput';
import type { Flight, Person, Plane } from '../../types';
import FlightModal from './FlightModal';
import CloseFlightModal from './CloseFlightModal';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import { toast, extractErrorMessage } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

type MenuState = { id: number; top: number; right: number };

const TABS = [
  { label: 'Todos', value: undefined },
  { label: 'Instrução', value: 'Instrução' },
  { label: 'Sócio Solo', value: 'Sócio Solo' },
  { label: 'Sócio Duplo Comando', value: 'Sócio Duplo Comando' },
] as const;

type TabValue = typeof TABS[number]['value'];

export default function Flights() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const [tab, setTab] = useState<TabValue>(undefined);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, tab, dateFrom, dateTo]);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [registerModal, setRegisterModal] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [closingFlight, setClosingFlight] = useState<Flight | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['flights', tab, debouncedSearch, dateFrom, dateTo, page],
    queryFn: () => getFlights(page, 20, undefined, undefined, tab, dateFrom || undefined, dateTo || undefined, debouncedSearch || undefined),
    enabled: highlightId == null,
  });

  const { data: singleFlight, isLoading: loadingSingle } = useQuery({
    queryKey: ['flight', highlightId],
    queryFn: () => getFlight(highlightId!),
    enabled: highlightId != null,
  });

  const flights = highlightId != null ? (singleFlight ? [singleFlight] : []) : (data?.data ?? []);
  const isLoading2 = highlightId != null ? loadingSingle : isLoading;

  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const customers: Person[] = customersData?.data ?? [];

  const { data: planesData } = useQuery({ queryKey: ['planes', 1], queryFn: () => getPlanes(1, 9999) });
  const planes: Plane[] = planesData?.data ?? [];

  const createMut = useMutation({
    mutationFn: createFlight,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flights'] }); setRegisterModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updateFlight(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flights'] }); setEditFlight(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteMut = useMutation({ mutationFn: deleteFlight, onSuccess: () => qc.invalidateQueries({ queryKey: ['flights'] }), onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deleteFlight(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flights'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuFlight = menuState ? flights.find(f => f.id === menuState.id) ?? null : null;
  const allIds = flights.map(x => x.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: TableColumn<Flight>[] = [
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
      key: 'plane',
      label: 'Aeronave',
      render: row => (
        <span className="flex items-center gap-1.5 font-medium">
          {row.plane?.registration ?? `${row.plane_id}`}
          {row.aircraft_type === 'glider' && <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-bg-sunk text-ink-3 border border-line leading-none">Planador</span>}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Cliente',
      render: row => row.customer?.name ?? `${row.customer_id}`,
    },
    {
      key: 'instructor',
      label: 'Instrutor',
      render: row => row.instructor?.customer?.name ?? '—',
    },
    {
      key: 'type',
      label: 'Tipo',
      render: row => row.type,
    },
    {
      key: 'route',
      label: 'Rota',
      render: row => <span className="font-mono text-[12px]">{row.origin} → {row.destination}</span>,
    },
    {
      key: 'start_date',
      label: 'Início',
      render: row => <span className="font-mono text-[12px]">{formatDate(row.start_date)}</span>,
    },
    {
      key: 'total_hours',
      label: 'Horas',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => formatHours(row.total_hours),
    },
    {
      key: 'total_amount',
      label: 'Valor',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => row.total_amount != null ? (
        <span
          title={row.calculation_breakdown?.aircraft_type === 'glider'
            ? `Franquia: ${row.calculation_breakdown.initial_minutes} min = R$ ${row.calculation_breakdown.initial_value?.toFixed(2)}\nExcedente: ${row.calculation_breakdown.exceeded_minutes} min × R$ ${row.calculation_breakdown.minute_value?.toFixed(2)}/min\nTotal: ${row.calculation_breakdown.total_minutes} min = R$ ${row.calculation_breakdown.total_amount.toFixed(2)}`
            : undefined
          }
          className={row.calculation_breakdown?.aircraft_type === 'glider' ? 'cursor-help underline decoration-dotted' : undefined}
        >
          R$ {formatBRL(row.total_amount)}
        </span>
      ) : '—',
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-10',
      cellClassName: 'w-10',
      stopPropagation: true,
      render: row => (
        <Button variant="icon" onClick={e => {
          e.stopPropagation();
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuState(s => s?.id === row.id ? null : { id: row.id, top: r.bottom + 4, right: window.innerWidth - r.right });
        }}>
          <MoreHorizontal size={15} />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Voos"
        description="Registro de operações de voo"
        action={can(PERM.FLIGHTS.CREATE) ? (
          <Button variant="primary" onClick={() => setRegisterModal(true)}>
            <Plus size={14} /> Novo voo
          </Button>
        ) : undefined}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-end">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Início</span>
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
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
          <div className="flex items-center">
            <div className="px-3.5 py-2 flex items-center">
              <Checkbox checked={allSelected} onChange={toggleAll} />
            </div>
            {TABS.map(t => (
              <button
                key={String(t.value)}
                onClick={() => { setTab(t.value); setPage(1); }}
                className="px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 whitespace-nowrap"
                style={{ color: tab === t.value ? 'var(--ink)' : 'var(--ink-3)', borderBottomColor: tab === t.value ? 'var(--accent)' : 'transparent', marginBottom: -1 }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[260px]"
              placeholder="Buscar por aeronave ou cliente"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
            <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <span className="flex-1" />
            {can(PERM.FLIGHTS.DELETE) && (
              <Button variant="danger" onClick={() => bulkDeleteMut.mutate([...selected])}>
                <Trash2 size={14} /> Remover selecionados
              </Button>
            )}
          </div>
        )}

        <Table
          columns={columns}
          data={flights}
          keyField="id"
          emptyMessage="Nenhum voo encontrado."
          isLoading={isLoading2}
        />
        {highlightId == null && <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />}
      </div>

      </div>

      {menuState && menuFlight && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          {!menuFlight.end_date && can(PERM.FLIGHTS.UPDATE) && (
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => { setMenuState(null); setClosingFlight(menuFlight); }}><CheckIcon size={14} /> Encerrar voo</button>
          )}
          {can(PERM.FLIGHTS.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setEditFlight(menuFlight)}><Edit size={14} /> Editar</button>}
          {can(PERM.FLIGHTS.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuFlight.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {registerModal && (
        <FlightModal mode="new" customers={customers} planes={planes} onClose={() => setRegisterModal(false)} onSave={(d) => createMut.mutate(d)} />
      )}
      {editFlight && (
        <FlightModal mode="edit" flight={editFlight} customers={customers} planes={planes} onClose={() => setEditFlight(null)} onSave={(data) => updateMut.mutate({ id: editFlight.id, data })} />
      )}
      {closingFlight && (
        <CloseFlightModal flight={closingFlight} onClose={() => setClosingFlight(null)} onSave={(end_date) => closeFlight(closingFlight.id, end_date).then(() => { qc.invalidateQueries({ queryKey: ['flights'] }); setClosingFlight(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)))} />
      )}
    </div>
  );
}
