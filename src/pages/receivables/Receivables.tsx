import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Trash2, Check as CheckIcon, Eye, BarChart3, ArrowDownLeft, Clock, AlertCircle } from 'lucide-react';
import { getReceivables, createReceivable, updateReceivable, deleteReceivable, registerPayment } from '../../api/receivables';
import Checkbox from '../../components/ui/Checkbox';
import { getPeoples } from '../../api/peoples';
import { getPlanes } from '../../api/planes';
import { getCompanies } from '../../api/companies';
import DateInput from '../../components/DateInput';
import { formatBRL, formatDate, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import type { Receivable, Plane, Person, Company } from '../../types';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import SettleModal from '../../components/SettleModal';
import Badge from '../../components/ui/Badge';
import { toast, extractErrorMessage } from '../../utils/toast';
import { NewReceivableModal } from './NewReceivableModal';
import { EditReceivableModal } from './EditReceivableModal';

type NamedOption = { id: number; name: string };

const TABS = [['all','Todos'],['0','A receber'],['partial','Parcial'],['1','Pagos'],['overdue','Vencidos']] as const;
type MenuState = { id: number; top: number; right: number };

const lbl = 'text-[12px] font-medium text-ink-2';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

export default function Receivables() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [tab, setTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [editRec, setEditRec] = useState<Receivable | null>(null);
  const [settleRec, setSettleRec] = useState<Receivable | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [tab, debouncedSearch, dateFrom, dateTo]);

  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const customers = customersData?.data ?? [];

  const { data: planesData } = useQuery({ queryKey: ['planes', 1], queryFn: () => getPlanes(1, 9999) });
  const planes: Plane[] = planesData?.data ?? [];

  const { data: instructorData } = useQuery({ queryKey: ['peoples', '', 'instructor', 1], queryFn: () => getPeoples(undefined, 'instructor', 1, 9999) });
  const instructors: NamedOption[] = (instructorData?.data ?? [])
    .filter((c: Person) => c.instructors?.length > 0)
    .map((c: Person) => ({ id: c.instructors[0].id, name: c.name }));

  const { data: partnerData } = useQuery({ queryKey: ['peoples', '', 'partner', 1], queryFn: () => getPeoples(undefined, 'partner', 1, 9999) });
  const partners: NamedOption[] = (partnerData?.data ?? [])
    .filter((c: Person) => c.partners?.length > 0)
    .map((c: Person) => ({ id: c.partners[0].id, name: c.name }));

  const { data: employeeData } = useQuery({ queryKey: ['peoples', '', 'employee', 1], queryFn: () => getPeoples(undefined, 'employee', 1, 9999) });
  const employees: NamedOption[] = (employeeData?.data ?? [])
    .filter((c: Person) => (c.employees ?? []).length > 0)
    .map((c: Person) => ({ id: c.employees![0].id, name: c.name }));

  const { data: companiesData } = useQuery({ queryKey: ['companies', '', 1], queryFn: () => getCompanies(undefined, 1, 9999) });
  const companies: Company[] = companiesData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['receivables', tab, debouncedSearch, dateFrom, dateTo, page],
    queryFn: () => getReceivables(tab === 'all' ? undefined : tab, debouncedSearch || undefined, dateFrom || undefined, dateTo || undefined, page),
  });
  const allRecs = data?.data ?? [];

  const deleteMut = useMutation({ mutationFn: deleteReceivable, onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }), onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deleteReceivable(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const payMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: unknown }) => registerPayment(id, d as { amount_received: number; payment_method?: string; payment_date?: string; notes?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setSettleRec(null); },
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Títulos a receber</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Títulos gerados por voos, mensalidades e serviços</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
{can(PERM.RECEIVABLES.CREATE) && <button className={btnPrimary} onClick={() => setNewModal(true)}><Plus size={14} /> Novo título</button>}
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-end">
        <span className={lbl + ' whitespace-nowrap'}>Criação</span>
        <div className="flex items-center gap-2">
          <span className={lbl + ' whitespace-nowrap'}>de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
        </div>
        <div className="flex items-center gap-2">
          <span className={lbl + ' whitespace-nowrap'}>Até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
        </div>
        <button className={btnPrimary} onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); }}>Aplicar</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><BarChart3 size={18} /></div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[12px] text-ink-3 font-medium">Valor total</div>
            <div className="text-[20px] font-bold tracking-tight font-mono"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(total)}</div>
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[12px] text-ink-3 font-medium">Valor recebido</div>
            <div className="text-[20px] font-bold tracking-tight font-mono text-success"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(received)}</div>
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Clock size={18} /></div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[12px] text-ink-3 font-medium">Valor a receber</div>
            <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(total - received)}</div>
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><AlertCircle size={18} /></div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[12px] text-ink-3 font-medium">Valor vencido</div>
            <div className="text-[20px] font-bold tracking-tight font-mono text-danger"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(overdue)}</div>
          </div>
        </div>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
          <div className="flex">
            {TABS.map(([k, l]) => (
              <button key={k}
                className="px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 whitespace-nowrap"
                style={{ color: tab === k ? 'var(--ink)' : 'var(--ink-3)', borderBottomColor: tab === k ? 'var(--accent)' : 'transparent', marginBottom: -1 }}
                onClick={() => setTab(k)}
              >{l}</button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[250px]" placeholder="Buscar por título ou pagador" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? <div className="py-8 text-center text-[13px] text-ink-3">Carregando…</div> : (
          <>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
                <span className="flex-1" />
                {can(PERM.RECEIVABLES.DELETE) && (
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
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">ID</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Título</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Tipo</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Pagador</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Vencimento</th>
                    <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
                    <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Recebido</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Progresso</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Status</th>
                    <th className="px-3.5 py-2.5 bg-bg border-b border-line w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {allRecs.map(r => {
                    const st = receivableStatus(r);
                    const pct = Number(r.total_amount) > 0 ? Math.round((Number(r.amount_received) / Number(r.total_amount)) * 100) : 0;
                    return (
                      <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                        <td className="px-3.5 py-2.5 border-b border-line w-9" onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} /></td>
                        <td className="px-3.5 py-2.5 border-b border-line font-mono text-[11.5px]">{r.id}</td>
                        <td className="px-3.5 py-2.5 border-b border-line">{r.title}</td>
                        <td className="px-3.5 py-2.5 border-b border-line">{r.product ? <span className="inline-flex items-center px-1.5 py-px rounded-[3px] text-[11px] font-medium bg-bg-sunk text-ink-3 border border-line">{r.product}</span> : '—'}</td>
                        <td className="px-3.5 py-2.5 border-b border-line text-[12px] text-ink-3">{r.customer?.name ?? r.company?.name ?? r.instructor?.customer?.name ?? '—'}</td>
                        <td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{formatDate(r.expiration_date)}</td>
                        <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(r.total_amount)}</td>
                        <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">{`R$ ${formatBRL(r.amount_received)}`}</td>
                        <td className="px-3.5 py-2.5 border-b border-line" style={{ minWidth: 120 }}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--line)', transition: 'width 0.3s' }} /></div>
                            <span className="font-mono text-[11px] min-w-[32px] text-right" style={{ color: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--ink-3)' }}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 border-b border-line">
                          <Badge variant={STATUS_BADGE[st] as 'success' | 'warn' | 'danger' | 'accent' | 'default'}>{STATUS_LABEL[st]}</Badge>
                        </td>
                        <td className="px-3.5 py-2.5 border-b border-line w-10" onClick={e => e.stopPropagation()}>
                          <button className={iconBtn} onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuState(s => s?.id === r.id ? null : { id: r.id, top: rect.bottom + 4, right: window.innerWidth - rect.right }); }}><MoreHorizontal size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {allRecs.length === 0 && <tr><td colSpan={11} className="px-3.5 py-8 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
          </>
        )}
      </div>
      </div>

      {menuState && menuRec && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => { setMenuState(null); navigate(`/receivables/${menuRec.id}`); }}><Eye size={14} /> Ver detalhes</button>
          {can(PERM.RECEIVABLES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setEditRec(menuRec)}><Edit size={14} /> Editar</button>}
          {receivableStatus(menuRec) !== 'paid' && can(PERM.RECEIVABLES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setSettleRec(menuRec)}><CheckIcon size={14} /> Receber</button>}
          {can(PERM.RECEIVABLES.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuRec.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {newModal && <NewReceivableModal customers={customers} instructors={instructors} partners={partners} employees={employees} planes={planes} companies={companies} onClose={() => setNewModal(false)} onSave={d => createReceivable(d).then(() => { qc.invalidateQueries({ queryKey: ['receivables'] }); setNewModal(false); }).catch((e: unknown) => toast.error(extractErrorMessage(e)))} />}
      {editRec && <EditReceivableModal rec={editRec} onClose={() => setEditRec(null)} onSave={d => updateReceivable(editRec.id, d).then(() => { qc.invalidateQueries({ queryKey: ['receivables'] }); setEditRec(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)))} />}
      {settleRec && <SettleModal rec={settleRec} onClose={() => setSettleRec(null)} onSave={d => payMut.mutate({ id: settleRec.id, d })} />}
    </div>
  );
}
