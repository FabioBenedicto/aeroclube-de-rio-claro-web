import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Eye, Trash2 } from 'lucide-react';
import Checkbox from '../../components/ui/Checkbox';
import { getPlanes, createPlane, updatePlane, deletePlane, bulkDeletePlanes } from '../../api/planes';
import { getSettings } from '../../api/settings';
import type { Plane } from '../../types';
import PlaneModal from './PlaneModal';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { toast, extractErrorMessage } from '../../utils/toast';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import Skeleton from '../../components/ui/Skeleton';
import DateRangeFilter from '../../components/DateRangeFilter';
import SearchInput from '../../components/ui/SearchInput';

type MenuState = { id: number; top: number; right: number };

export default function Planes() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeTab, setTypeTab] = useState<'all' | 'airplane' | 'glider'>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, dateFrom, dateTo, typeTab]);

  const { data: settings, isLoading: settingsLoading, isError: settingsError } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const aircraftTypeFilter = typeTab === 'all' ? undefined : typeTab.toUpperCase();
  const { data, isLoading } = useQuery({ queryKey: ['planes', debouncedSearch, dateFrom, dateTo, page, typeTab], queryFn: () => getPlanes(page, 20, dateFrom || undefined, dateTo || undefined, debouncedSearch || undefined, aircraftTypeFilter) });
  const planes = data?.data ?? [];
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; plane?: Plane } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [gliderTooltip, setGliderTooltip] = useState<{ top: number; left: number } | null>(null);

  const deleteMut = useMutation({ mutationFn: deletePlane, onSuccess: () => qc.invalidateQueries({ queryKey: ['planes'] }), onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeletePlanes(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planes'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  function handleSave(d: unknown, id?: number) {
    const fn = id ? updatePlane(id, d) : createPlane(d);
    fn.then(() => { qc.invalidateQueries({ queryKey: ['planes'] }); setModal(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)));
  }

  const menuPlane = menuState ? planes.find(p => p.id === menuState.id) ?? null : null;
  const allIds = planes.map(x => x.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: TableColumn<Plane>[] = [
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
      key: 'registration',
      label: 'Matrícula',
      render: row => <span className="font-medium font-mono">{row.registration}</span>,
    },
    {
      key: 'model',
      label: 'Modelo',
      render: row => row.model ?? '—',
    },
    {
      key: 'type',
      label: 'Tipo',
      render: row => row.type === 'GLIDER' ? (
        <span
          onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setGliderTooltip({ top: r.top, left: r.left }); }}
          onMouseLeave={() => setGliderTooltip(null)}
        >
          <Chip variant="default">Planador</Chip>
        </span>
      ) : (
        <Chip variant="default">Avião</Chip>
      ),
    },
    {
      key: 'flight_hour_value',
      label: 'Valor/h',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono',
      render: row => row.type === 'GLIDER' ? (
        <span
          className="text-ink-3 text-[12px] underline decoration-dashed underline-offset-2 cursor-default"
          onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setGliderTooltip({ top: r.top, left: r.left }); }}
          onMouseLeave={() => setGliderTooltip(null)}
        >
          Regra de cobrança
        </span>
      ) : row.flight_hour_value != null ? `R$ ${Number(row.flight_hour_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—',
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
        title="Aeronaves"
        description="Frota do aeroclube"
        action={can(PERMISSIONS.AIRCRAFT.CREATE) ? (
          <Button variant="primary" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={14} /> Nova aeronave
          </Button>
        ) : undefined}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }} />

        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
            <div className="flex items-center">
              <div className="px-3.5 py-2 flex items-center">
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </div>
              {([['all', 'Todos'], ['airplane', 'Aviões'], ['glider', 'Planadores']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTypeTab(val)}
                  className="px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 whitespace-nowrap"
                  style={{ color: typeTab === val ? 'var(--ink)' : 'var(--ink-3)', borderBottomColor: typeTab === val ? 'var(--accent)' : 'transparent', marginBottom: -1 }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por matrícula ou modelo" minWidth={265} />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
              <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
              <span className="flex-1" />
              {can(PERMISSIONS.AIRCRAFT.DELETE) && (
                <Button variant="danger" onClick={() => bulkDeleteMut.mutate([...selected])}>
                  <Trash2 size={14} /> Remover selecionados
                </Button>
              )}
            </div>
          )}

          <Table
            columns={columns}
            data={planes}
            keyField="id"
            onRowClick={p => navigate(`/planes/${p.id}`)}
            emptyMessage="Nenhuma aeronave encontrada."
            isLoading={isLoading}
          />
          <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
        </div>
      </div>

      {gliderTooltip && (
        <div
          className="fixed z-50 w-56 rounded-lg border border-line bg-bg-elev shadow-[var(--shadow)] px-3 py-2.5 pointer-events-none"
          style={{ top: gliderTooltip.top - 8, left: gliderTooltip.left, transform: 'translateY(-100%)' }}
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

      {menuState && menuPlane && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/planes/${menuPlane.id}`)}>Ver detalhes</RowMenuItem>
          {can(PERMISSIONS.AIRCRAFT.UPDATE) && <RowMenuItem icon={<Edit size={14} />} onClick={() => setModal({ mode: 'edit', plane: menuPlane })}>Editar</RowMenuItem>}
          {can(PERMISSIONS.AIRCRAFT.DELETE) && <><RowMenuSep /><RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuPlane.id)}>Remover</RowMenuDangerItem></>}
        </RowMenu>
      )}

      {modal && <PlaneModal mode={modal.mode} plane={modal.plane} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
