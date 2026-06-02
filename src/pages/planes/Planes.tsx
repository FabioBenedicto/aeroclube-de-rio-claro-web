import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Eye, Trash2 } from 'lucide-react';
import DateInput from '../../components/DateInput';
import Checkbox from '../../components/ui/Checkbox';
import { getPlanes, createPlane, updatePlane, deletePlane } from '../../api/planes';
import { getSettings } from '../../api/settings';
import type { Plane } from '../../types';
import PlaneModal from './PlaneModal';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import { toast, extractErrorMessage } from '../../utils/toast';

type MenuState = { id: number; top: number; right: number };

export default function Planes() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeTab, setTypeTab] = useState<'all' | 'airplane' | 'glider'>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, dateFrom, dateTo, typeTab]);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const aircraftTypeFilter = typeTab === 'all' ? undefined : typeTab;
  const { data, isLoading } = useQuery({ queryKey: ['planes', debouncedSearch, dateFrom, dateTo, page, typeTab], queryFn: () => getPlanes(page, 20, dateFrom || undefined, dateTo || undefined, debouncedSearch || undefined, aircraftTypeFilter) });
  const planes = data?.data ?? [];
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; plane?: Plane } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [gliderTooltip, setGliderTooltip] = useState<{ top: number; right: number } | null>(null);

  const deleteMut = useMutation({ mutationFn: deletePlane, onSuccess: () => qc.invalidateQueries({ queryKey: ['planes'] }), onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deletePlane(id))),
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Aeronaves</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Frota do aeroclube</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
{can(PERM.PLANES.CREATE) && (
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={() => setModal({ mode: 'new' })}>
              <Plus size={14} /> Nova aeronave
            </button>
          )}
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-end">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Criação</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</button>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
          <div className="flex">
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
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[265px]"
              placeholder="Buscar por matrícula ou modelo"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-[13px] text-ink-3">Carregando…</div>
        ) : (
          <>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
                <span className="flex-1" />
                {can(PERM.PLANES.DELETE) && (
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-danger border border-danger text-white cursor-pointer hover:opacity-90" onClick={() => bulkDeleteMut.mutate([...selected])}>
                    <Trash2 size={14} /> Remover selecionados
                  </button>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line w-9"><Checkbox checked={allSelected} onChange={toggleAll} /></th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Matrícula</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Modelo</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Tipo</th>
                    <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor/h</th>
                    <th className="px-3.5 py-2.5 bg-bg border-b border-line w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {planes.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/planes/${p.id}`)}>
                      <td className="px-3.5 py-2.5 border-b border-line w-9" onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} /></td>
                      <td className="px-3.5 py-2.5 border-b border-line font-medium font-mono">{p.registration}</td>
                      <td className="px-3.5 py-2.5 border-b border-line">{p.model ?? '—'}</td>
                      <td className="px-3.5 py-2.5 border-b border-line">
                        <span className={`inline-block px-1.5 py-0.5 text-[11px] font-medium rounded border leading-none ${p.aircraft_type === 'glider' ? 'bg-bg-sunk text-ink-3 border-line' : 'bg-accent/8 text-accent border-accent/20'}`}>
                          {p.aircraft_type === 'glider' ? 'Planador' : 'Avião'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">
                        {p.aircraft_type === 'glider' ? (
                          <span
                            className="text-ink-3 text-[12px] underline decoration-dashed underline-offset-2 cursor-default"
                            onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setGliderTooltip({ top: r.top, right: window.innerWidth - r.right }); }}
                            onMouseLeave={() => setGliderTooltip(null)}
                          >
                            Regra de cobrança
                          </span>
                        ) : p.flight_hour_value != null ? `R$ ${Number(p.flight_hour_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-line w-10" onClick={e => e.stopPropagation()}>
                        <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={e => {
                          e.stopPropagation();
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuState(s => s?.id === p.id ? null : { id: p.id, top: r.bottom + 4, right: window.innerWidth - r.right });
                        }}><MoreHorizontal size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {planes.length === 0 && (
                    <tr><td colSpan={6} className="px-3.5 py-8 text-center text-ink-3">Nenhuma aeronave encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
          </>
        )}
      </div>

      </div>

      {gliderTooltip && settings && (
        <div
          className="fixed z-50 w-56 rounded-lg border border-line bg-bg-elev shadow-[var(--shadow)] px-3 py-2.5 pointer-events-none"
          style={{ top: gliderTooltip.top - 8, right: gliderTooltip.right, transform: 'translateY(-100%)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-2">Cobrança do planador</div>
          <div className="text-[12px] text-ink">
            <span className="text-ink-3">Franquia </span>{settings.glider_initial_minutes} min → <strong>R$ {Number(settings.glider_initial_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div className="text-[12px] text-ink mt-1">
            <span className="text-ink-3">Excedente </span>R$ {Number(settings.glider_minute_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-ink-3">/min</span>
          </div>
        </div>
      )}

      {menuState && menuPlane && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => navigate(`/planes/${menuPlane.id}`)}><Eye size={14} /> Ver detalhes</button>
          {can(PERM.PLANES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setModal({ mode: 'edit', plane: menuPlane })}><Edit size={14} /> Editar</button>}
          {can(PERM.PLANES.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuPlane.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {modal && <PlaneModal mode={modal.mode} plane={modal.plane} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
