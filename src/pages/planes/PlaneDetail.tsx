import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Edit, Plane, Clock, ArrowDownLeft, ArrowUpRight, MoreHorizontal, Eye, Check as CheckIcon, Trash2 } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import type { People, Company, Flight, Receivable, Payable } from '../../types';
import { getPlane, updatePlane } from '../../api/planes';
import { getSettings } from '../../api/settings';
import { getPeoples } from '../../api/peoples';
import { getCompanies } from '../../api/companies';
import { createFlight, updateFlight, closeFlight, deleteFlight, getFlightStats } from '../../api/flights';
import { createReceivable, updateReceivable, deleteReceivable } from '../../api/receivables';
import { createPayable, updatePayable, deletePayable } from '../../api/payables';
import { NewReceivableModal } from '../receivables/NewReceivableModal';
import { EditReceivableModal } from '../receivables/EditReceivableModal';
import { NewPayableModal } from '../payables/NewPayableModal';
import { EditPayableModal } from '../payables/EditPayableModal';
import { formatBRL, formatDate, formatHours, receivableStatus, payableStatus, STATUS_LABEL, STATUS_BADGE, PAYABLE_STATUS_LABEL } from '../../utils/format';
import FlightModal from '../flights/FlightModal';
import CloseFlightModal from '../flights/CloseFlightModal';
import PlaneModal from './PlaneModal';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';
import { toast, extractErrorMessage } from '../../utils/toast';
import Button from '../../components/ui/Button';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import DateRangeFilter from '../../components/DateRangeFilter';
import Table, { type TableColumn } from '../../components/ui/Table';

type BadgeVariant = 'success' | 'warn' | 'danger' | 'accent' | 'default';
type TabKey = 'voos' | 'receber_assoc' | 'pagar_assoc';



const TABS: { key: TabKey; label: string }[] = [
  { key: 'voos', label: 'Voos' },
  { key: 'receber_assoc', label: 'Títulos a receber' },
  { key: 'pagar_assoc', label: 'Títulos a pagar' },
];

export default function PlaneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const planeId = Number(id);

  const [tab, setTab] = useState<TabKey>('voos');
  const [flightModal, setFlightModal] = useState(false);
  const [editPlaneModal, setEditPlaneModal] = useState(false);
  const [newRecModal, setNewRecModal] = useState(false);
  const [newPayModal, setNewPayModal] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [editRec, setEditRec] = useState<Receivable | null>(null);
  const [editPay, setEditPay] = useState<Payable | null>(null);
  const [closingFlight, setClosingFlight] = useState<Flight | null>(null);
  const [flightMenu, setFlightMenu] = useState<{ id: number; top: number; right: number } | null>(null);
  const [recMenu, setRecMenu] = useState<{ id: number; top: number; right: number } | null>(null);
  const [payMenu, setPayMenu] = useState<{ id: number; top: number; right: number } | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: plane, isLoading } = useQuery({ queryKey: ['plane', planeId], queryFn: () => getPlane(planeId) });
  const { data: planeFlightStats } = useQuery({ queryKey: ['flights', 'stats', 'aircraft', planeId], queryFn: () => getFlightStats({ aircraftId: planeId }) });
  const { data: customersResponse } = useQuery({ queryKey: ['peoples'], queryFn: () => getPeoples(), enabled: flightModal || !!editFlight });
  const customersData = customersResponse?.data ?? [];
  const { data: settings, isLoading: settingsLoading, isError: settingsError } = useQuery({ queryKey: ['settings'], queryFn: getSettings, enabled: plane?.type === 'GLIDER' });

  const titleModalOpen = newRecModal || newPayModal;
  const { data: allCustomersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999), enabled: titleModalOpen });
  const allCustomers = allCustomersData?.data ?? [];
  const { data: instructorData } = useQuery({ queryKey: ['peoples', '', 'instructor', 1], queryFn: () => getPeoples(undefined, 'instructor', 1, 9999), enabled: titleModalOpen });
  const instructors = (instructorData?.data ?? []).filter((c: People) => c.instructors != null).map((c: People) => ({ id: c.instructors!.id, name: c.name }));
  const { data: partnerData } = useQuery({ queryKey: ['peoples', '', 'partner', 1], queryFn: () => getPeoples(undefined, 'partner', 1, 9999), enabled: titleModalOpen });
  const partners = (partnerData?.data ?? []).filter((c: People) => c.partners != null).map((c: People) => ({ id: c.partners!.id, name: c.name }));
  const { data: employeeData } = useQuery({ queryKey: ['peoples', '', 'employee', 1], queryFn: () => getPeoples(undefined, 'employee', 1, 9999), enabled: titleModalOpen });
  const employees = (employeeData?.data ?? []).filter((c: People) => c.employees != null).map((c: People) => ({ id: c.employees!.id, name: c.name }));
  const { data: studentData } = useQuery({ queryKey: ['peoples', '', 'student', 1], queryFn: () => getPeoples(undefined, 'student', 1, 9999), enabled: titleModalOpen });
  const students = (studentData?.data ?? []).filter((c: People) => c.students != null).map((c: People) => ({ id: c.students!.id, name: c.name }));
  const { data: companiesData } = useQuery({ queryKey: ['companies', '', 1], queryFn: () => getCompanies(undefined, 1, 9999), enabled: titleModalOpen });
  const companies: Company[] = companiesData?.data ?? [];
  const [gliderTooltip, setGliderTooltip] = useState<{ top: number; left: number } | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['plane', planeId] });
    qc.invalidateQueries({ queryKey: ['flights', 'stats', 'aircraft', planeId] });
  };

  const flightMut = useMutation({
    mutationFn: createFlight,
    onSuccess: () => { invalidate(); setFlightModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateFlightMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updateFlight(id, data),
    onSuccess: () => { invalidate(); setEditFlight(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const closeFlightMut = useMutation({
    mutationFn: ({ id, end_date }: { id: number; end_date: string }) => closeFlight(id, end_date),
    onSuccess: () => { invalidate(); setClosingFlight(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteFlightMut = useMutation({
    mutationFn: deleteFlight,
    onSuccess: () => { invalidate(); setFlightMenu(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updatePlaneMut = useMutation({
    mutationFn: (data: unknown) => updatePlane(planeId, data),
    onSuccess: () => { invalidate(); setEditPlaneModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const newRecMut = useMutation({
    mutationFn: (data: unknown) => createReceivable(data),
    onSuccess: () => { invalidate(); setNewRecModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const newPayMut = useMutation({
    mutationFn: (data: unknown) => createPayable(data),
    onSuccess: () => { invalidate(); setNewPayModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteRecMut = useMutation({
    mutationFn: deleteReceivable,
    onSuccess: () => { invalidate(); setRecMenu(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateRecMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updateReceivable(id, data),
    onSuccess: () => { invalidate(); setEditRec(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deletePayMut = useMutation({
    mutationFn: deletePayable,
    onSuccess: () => { invalidate(); setPayMenu(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updatePayMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updatePayable(id, data),
    onSuccess: () => { invalidate(); setEditPay(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton.Block className="h-[13px] w-14 mb-1" />
          <Skeleton.Title width="w-32" />
          <div className="flex items-center gap-2 mt-1">
            <Skeleton.Block className="h-5 w-16 rounded-full" />
            <Skeleton.Text width="w-24" />
          </div>
        </div>
        <Skeleton.Block className="h-8 w-20 rounded-lg mt-6" />
      </div>
      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <Skeleton.Card key={i} />)}
        </div>
        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 border-b border-line"><Skeleton.Text width="w-24" /></div>
          <table className="w-full border-collapse">
            <tbody><Skeleton.TableRows cols={9} rows={5} /></tbody>
          </table>
        </div>
      </div>
    </div>
  );
  if (!plane) return <div className="p-8 text-[13px] text-ink-3">Aeronave não encontrada.</div>;

  function inRange(dateStr: string | null | undefined): boolean {
    const d = dateStr ? dateStr.slice(0, 10) : null;
    if (!d) return true;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  }

  const flights = (plane.flights ?? []).filter(f => inRange(f.created_at));
  const payables = (plane.payables ?? []).filter(p => inRange(p.created_at));
  const receivables = (plane.receivables ?? []).filter(r => inRange(r.created_at));
  const assocReceivables = receivables.filter(r => r.stakeholder != null && r.stakeholder !== 'NONE');
  const assocPayables = payables.filter(p => p.stakeholder != null && p.stakeholder !== 'NONE');

  const flightColumns: TableColumn<Flight>[] = [
    { key: 'id', label: 'ID', render: f => <span className="font-mono text-[11.5px]">{f.id}</span> },
    {
      key: 'aircraft', label: 'Aeronave',
      render: f => (
        <span className="flex items-center gap-1.5 font-medium">
          {f.aircraft?.registration ?? String(f.aircraft_id)}
          {f.aircraft?.type === 'GLIDER' && <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-bg-sunk text-ink-3 border border-line leading-none">Planador</span>}
        </span>
      ),
    },
    { key: 'people', label: 'Cliente', render: f => f.people?.name ?? String(f.people_id) },
    { key: 'instructor', label: 'Instrutor', render: f => f.instructor?.people?.name ?? '—' },
    { key: 'type', label: 'Tipo', render: f => f.type ? <Chip>{f.type}</Chip> : '—' },
    { key: 'route', label: 'Rota', render: f => <span className="font-mono text-[12px]">{f.origin} → {f.destination}</span> },
    { key: 'start_date', label: 'Início', cellClassName: 'font-mono text-[12px]', render: f => formatDate(f.start_date) },
    { key: 'total_hours', label: 'Horas', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: f => formatHours(f.total_hours) },
    {
      key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono',
      render: f => f.total_amount != null ? (
        <span
          title={f.calculation_breakdown?.aircraft_type === 'glider'
            ? `Franquia: ${f.calculation_breakdown.initial_minutes} min = R$ ${f.calculation_breakdown.initial_value?.toFixed(2)}\nExcedente: ${f.calculation_breakdown.exceeded_minutes} min × R$ ${f.calculation_breakdown.minute_value?.toFixed(2)}/min\nTotal: ${f.calculation_breakdown.total_minutes} min = R$ ${f.calculation_breakdown.total_amount.toFixed(2)}`
            : undefined}
          className={f.calculation_breakdown?.aircraft_type === 'glider' ? 'cursor-help underline decoration-dotted' : undefined}
        >R$ {formatBRL(f.total_amount)}</span>
      ) : '—',
    },
    {
      key: 'actions', label: '', headerClassName: 'w-10', cellClassName: 'w-10', stopPropagation: true,
      render: f => (
        <Button variant="icon" onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setFlightMenu(s => s?.id === f.id ? null : { id: f.id, top: r.bottom + 4, right: window.innerWidth - r.right }); }}>
          <MoreHorizontal size={15} />
        </Button>
      ),
    },
  ];

  const recColumns: TableColumn<Receivable>[] = [
    { key: 'id', label: 'ID', render: r => <span className="font-mono text-[11.5px]">{r.id}</span> },
    { key: 'title', label: 'Título', render: r => <span className="font-medium">{r.title}</span> },
    { key: 'product', label: 'Tipo', render: r => r.receivable_type?.name ? <Chip>{r.receivable_type.name}</Chip> : '—' },
    {
      key: 'payer', label: 'Pagador',
      render: r => {
        const name = r.people?.name ?? r.person?.name ?? r.company?.name ?? r.instructor?.people?.name ?? r.instructor?.customer?.name ?? r.partner?.people?.name ?? r.partner?.customer?.name ?? r.employee?.people?.name ?? r.employee?.customer?.name ?? '—';
        return <span className="text-[12px] text-ink-3">{name}</span>;
      },
    },
    { key: 'expiration_date', label: 'Vencimento', render: r => <span className="font-mono text-[12px]">{formatDate(r.expiration_date)}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: r => `R$ ${formatBRL(r.total_amount)}` },
    { key: 'amount_received', label: 'Recebido', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: r => `R$ ${formatBRL(r.amount_received)}` },
    {
      key: 'progress', label: 'Progresso', headerClassName: 'min-w-[120px]',
      render: r => {
        const st = receivableStatus(r);
        const pct = Number(r.total_amount) > 0 ? Math.round((Number(r.amount_received) / Number(r.total_amount)) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--line)', transition: 'width 0.3s' }} /></div>
            <span className="font-mono text-[11px] min-w-[32px] text-right" style={{ color: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--ink-3)' }}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Status',
      render: r => { const st = receivableStatus(r); return <Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge>; },
    },
    {
      key: 'actions', label: '', headerClassName: 'w-10', cellClassName: 'w-10', stopPropagation: true,
      render: r => (
        <Button variant="icon" onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setRecMenu(s => s?.id === r.id ? null : { id: r.id, top: rect.bottom + 4, right: window.innerWidth - rect.right }); }}>
          <MoreHorizontal size={15} />
        </Button>
      ),
    },
  ];

  const payColumns: TableColumn<Payable>[] = [
    { key: 'id', label: 'ID', render: p => <span className="font-mono text-[11.5px]">{p.id}</span> },
    { key: 'title', label: 'Título', render: p => <span className="font-medium">{p.title}</span> },
    { key: 'product', label: 'Tipo', render: p => p.payable_type?.name ? <Chip>{p.payable_type.name}</Chip> : '—' },
    {
      key: 'payer', label: 'Recebedor',
      render: p => {
        const name = p.people?.name ?? p.company?.name ?? p.instructor?.people?.name ?? p.partner?.people?.name ?? p.employee?.people?.name ?? '—';
        return <span className="text-[12px] text-ink-3">{name}</span>;
      },
    },
    { key: 'expiration_date', label: 'Vencimento', render: p => <span className="font-mono text-[12px]">{p.expiration_date ? formatDate(p.expiration_date) : '—'}</span> },
    { key: 'total_amount', label: 'Valor', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: p => `R$ ${formatBRL(p.total_amount)}` },
    { key: 'amount_paid', label: 'Pago', headerClassName: 'text-right', cellClassName: 'text-right font-mono', render: p => `R$ ${formatBRL(p.amount_paid)}` },
    {
      key: 'progress', label: 'Progresso', headerClassName: 'w-32', cellClassName: 'w-32',
      render: p => {
        const st = payableStatus(p);
        const pct = Number(p.total_amount) > 0 ? Math.round((Number(p.amount_paid) / Number(p.total_amount)) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--line)', transition: 'width 0.3s' }} /></div>
            <span className="font-mono text-[11px] min-w-[32px] text-right" style={{ color: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--ink-3)' }}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Status',
      render: p => { const st = payableStatus(p); return <Badge variant={STATUS_BADGE[st] as BadgeVariant}>{PAYABLE_STATUS_LABEL[st]}</Badge>; },
    },
    {
      key: 'actions', label: '', headerClassName: 'w-10', cellClassName: 'w-10', stopPropagation: true,
      render: p => (
        <Button variant="icon" onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPayMenu(s => s?.id === p.id ? null : { id: p.id, top: rect.bottom + 4, right: window.innerWidth - rect.right }); }}>
          <MoreHorizontal size={15} />
        </Button>
      ),
    },
  ];

  const totalExpense = payables.reduce((s, p) => s + Number(p.total_amount), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/planes')}>
            <ChevronLeft size={15} /> Voltar
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0 font-mono">{plane.registration}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Chip variant="default">
              {plane.type === 'GLIDER' ? 'Planador' : 'Avião'}
            </Chip>
            {plane.model && <><span className="text-ink-3 text-[13px]">·</span><span className="text-[13px] text-ink-2">{plane.model}</span></>}
            <span className="text-ink-3 text-[13px]">·</span>
            {plane.type !== 'GLIDER' && plane.flight_hour_value != null
              ? <span className="text-[13px] font-mono text-ink-2">R$ {formatBRL(plane.flight_hour_value)}<span className="text-ink-3">/h</span></span>
              : <span
                  className="text-[13px] text-ink-2 underline decoration-dashed underline-offset-2 cursor-default"
                  onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setGliderTooltip({ top: r.top, left: r.right + 8 }); }}
                  onMouseLeave={() => setGliderTooltip(null)}
                >Regra de cobrança</span>
            }
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-6">
          <Button variant="default" onClick={() => setEditPlaneModal(true)}><Edit size={14} /> Editar</Button>
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-6">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Plane size={18} /></div>
            <div className="flex flex-col gap-0.5 min-w-0 w-full">
              <div className="text-[12px] text-ink-3 font-medium">Total de voos</div>
              <div className="text-[20px] font-bold tracking-tight leading-none">{planeFlightStats?.total ?? 0}</div>
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Clock size={18} /></div>
            <div className="flex flex-col gap-0.5 min-w-0 w-full">
              <div className="text-[12px] text-ink-3 font-medium">Total de horas de voo</div>
              <div className="text-[20px] font-bold tracking-tight leading-none font-mono">{formatHours(planeFlightStats?.total_hours ?? 0)}</div>
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
            <div className="flex flex-col gap-0.5 min-w-0 w-full">
              <div className="text-[12px] text-ink-3 font-medium">Receita gerada</div>
              <div className="text-[20px] font-bold tracking-tight leading-none font-mono text-success">R$ {formatBRL(planeFlightStats?.total_revenue ?? 0)}</div>
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><ArrowUpRight size={18} /></div>
            <div className="flex flex-col gap-0.5 min-w-0 w-full">
              <div className="text-[12px] text-ink-3 font-medium">Despesa gerada</div>
              <div className="text-[20px] font-bold tracking-tight leading-none font-mono text-danger">R$ {formatBRL(totalExpense)}</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
          <div className="flex">
            {TABS.map(t => (
              <button
                key={t.key}
                className="px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 whitespace-nowrap"
                style={{ color: tab === t.key ? 'var(--ink)' : 'var(--ink-3)', borderBottomColor: tab === t.key ? 'var(--accent)' : 'transparent', marginBottom: -1 }}
                onClick={() => setTab(t.key)}
              >{t.label}</button>
            ))}
          </div>
          <div className="flex-1" />
          {tab === 'voos' && (
            <Button variant="primary" onClick={() => setFlightModal(true)}><Plus size={14} /> Novo voo</Button>
          )}
          {tab === 'receber_assoc' && (
            <Button variant="primary" onClick={() => setNewRecModal(true)}><Plus size={14} /> Novo título a receber</Button>
          )}
          {tab === 'pagar_assoc' && (
            <Button variant="primary" onClick={() => setNewPayModal(true)}><Plus size={14} /> Novo título a pagar</Button>
          )}
        </div>

        {tab === 'voos' && (
          <Table columns={flightColumns} data={flights} keyField="id" emptyMessage="Nenhum voo encontrado." />
        )}

        {tab === 'receber_assoc' && (
          <Table columns={recColumns} data={assocReceivables} keyField="id" onRowClick={r => navigate(`/receivables/${r.id}`)} emptyMessage="Nenhum título associado." />
        )}

        {tab === 'pagar_assoc' && (
          <Table columns={payColumns} data={assocPayables} keyField="id" onRowClick={p => navigate(`/payables/${p.id}`)} emptyMessage="Nenhum título associado." />
        )}
        </div>
      </div>

      {flightModal && (
        <FlightModal
          mode="new"
          planes={[plane]}
          initialPlaneId={plane.id}
          onClose={() => setFlightModal(false)}
          onSave={(data) => flightMut.mutate(data)}
        />
      )}
      {editFlight && (
        <FlightModal
          mode="edit"
          flight={editFlight}
          planes={[plane]}
          onClose={() => setEditFlight(null)}
          onSave={(data) => updateFlightMut.mutate({ id: editFlight.id, data })}
        />
      )}
      {closingFlight && (
        <CloseFlightModal
          flight={closingFlight}
          onClose={() => setClosingFlight(null)}
          onSave={(end_date) => closeFlightMut.mutate({ id: closingFlight.id, end_date })}
        />
      )}
      {editPlaneModal && (
        <PlaneModal
          mode="edit"
          plane={plane}
          onClose={() => setEditPlaneModal(false)}
          onSave={(data) => updatePlaneMut.mutate(data)}
        />
      )}
      {newRecModal && (
        <NewReceivableModal
          customers={allCustomers}
          students={students}
          instructors={instructors}
          partners={partners}
          employees={employees}
          planes={[]}
          companies={companies}
          initialPlaneId={planeId}
          onClose={() => setNewRecModal(false)}
          onSave={d => newRecMut.mutate(d)}
        />
      )}
      {editRec && (
        <EditReceivableModal
          rec={editRec}
          onClose={() => setEditRec(null)}
          onSave={d => updateRecMut.mutate({ id: editRec.id, data: d })}
        />
      )}
      {editPay && (
        <EditPayableModal
          payable={editPay}
          onClose={() => setEditPay(null)}
          onSave={d => updatePayMut.mutate({ id: editPay.id, data: d })}
        />
      )}
      {newPayModal && (
        <NewPayableModal
          customers={allCustomers}
          students={students}
          instructors={instructors}
          partners={partners}
          employees={employees}
          planes={[]}
          companies={companies}
          initialPlaneId={planeId}
          onClose={() => setNewPayModal(false)}
          onSave={d => newPayMut.mutate(d)}
        />
      )}
      {flightMenu && (() => { const f = flights.find(x => x.id === flightMenu.id); return f ? (
        <RowMenu top={flightMenu.top} right={flightMenu.right} onClose={() => setFlightMenu(null)}>
          {!f.end_date && <RowMenuItem icon={<CheckIcon size={14} />} onClick={() => { setFlightMenu(null); setClosingFlight(f); }}>Encerrar voo</RowMenuItem>}
          <RowMenuItem icon={<Edit size={14} />} onClick={() => { setFlightMenu(null); setEditFlight(f); }}>Editar</RowMenuItem>
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteFlightMut.mutate(f.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      ) : null; })()}
      {recMenu && (() => { const r = assocReceivables.find(x => x.id === recMenu.id); return r ? (
        <RowMenu top={recMenu.top} right={recMenu.right} onClose={() => setRecMenu(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => { setRecMenu(null); navigate(`/receivables/${r.id}`); }}>Ver detalhes</RowMenuItem>
          <RowMenuItem icon={<Edit size={14} />} onClick={() => { setRecMenu(null); setEditRec(r); }}>Editar</RowMenuItem>
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteRecMut.mutate(r.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      ) : null; })()}
      {payMenu && (() => { const p = assocPayables.find(x => x.id === payMenu.id); return p ? (
        <RowMenu top={payMenu.top} right={payMenu.right} onClose={() => setPayMenu(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => { setPayMenu(null); navigate(`/payables/${p.id}`); }}>Ver detalhes</RowMenuItem>
          <RowMenuItem icon={<Edit size={14} />} onClick={() => { setPayMenu(null); setEditPay(p); }}>Editar</RowMenuItem>
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deletePayMut.mutate(p.id)}>Remover</RowMenuDangerItem>
        </RowMenu>
      ) : null; })()}

      {gliderTooltip && (
        <div
          className="fixed z-50 w-56 rounded-lg border border-line bg-bg-elev shadow-[var(--shadow)] px-3 py-2.5 pointer-events-none"
          style={{ top: gliderTooltip.top, left: gliderTooltip.left, transform: 'translateY(-100%)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-2">Cobrança do planador</div>
          {settingsLoading ? (
            <div className="flex flex-col gap-2"><Skeleton.Text width="w-full" /><Skeleton.Text width="w-4/5" /></div>
          ) : settingsError || !settings ? (
            <div className="text-[12px] text-ink-3">Configure em <strong>Configurações → Planador</strong></div>
          ) : (
            <>
              <div className="text-[12px] text-ink">
                <span className="text-ink-3">Franquia </span>{settings.glider_initial_minutes} min → <strong>R$ {Number(settings.glider_initial_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="text-[12px] text-ink mt-1">
                <span className="text-ink-3">Excedente </span>R$ {Number(settings.glider_minute_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-ink-3">/min</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

