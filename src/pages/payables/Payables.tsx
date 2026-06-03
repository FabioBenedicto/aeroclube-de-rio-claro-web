import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Trash2, Check as CheckIcon, Eye, BarChart3, ArrowUpRight, Hourglass, AlertCircle } from 'lucide-react';
import { getPayables, createPayable, deletePayable, registerPayablePayment } from '../../api/payables';
import Checkbox from '../../components/ui/Checkbox';
import PayModal from '../../components/PayModal';
import { getPeoples } from '../../api/peoples';
import { getPlanes } from '../../api/planes';
import { getCompanies } from '../../api/companies';
import DateInput from '../../components/DateInput';
import { formatBRL, formatDate } from '../../utils/format';
import type { Payable, Plane, Person, Company } from '../../types';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import { toast, extractErrorMessage } from '../../utils/toast';
import { NewPayableModal } from './NewPayableModal';

type NamedOption = { id: number; name: string };
const P_STATUS_LABEL: Record<string, string> = { open: 'A pagar', partial: 'Parcial', closed: 'Pago' };
const P_STATUS_BADGE: Record<string, string> = { open: 'warn', partial: 'accent', closed: 'success' };
type MenuState = { id: number; top: number; right: number };

const lbl = 'text-[12px] font-medium text-ink-2';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

export default function Payables() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [payPayable, setPayPayable] = useState<Payable | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => { setPage(1); }, [tab, search, dateFrom, dateTo]);

  const { data, isLoading } = useQuery({
    queryKey: ['payables', tab, search, dateFrom, dateTo, page],
    queryFn: () => getPayables(tab === 'all' ? undefined : tab, page, 20, undefined, search || undefined, dateFrom || undefined, dateTo || undefined),
  });
  const payables = data?.data ?? [];

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

  const deleteMut = useMutation({ mutationFn: deletePayable, onSuccess: () => qc.invalidateQueries({ queryKey: ['payables'] }), onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deletePayable(id))),
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
  const total = allP.reduce((a, p) => a + Number(p.amount), 0);
  const paid = allP.reduce((a, p) => a + Number(p.amount_paid), 0);
  const overdue = allP.filter(p => p.status !== 'closed' && p.due_date && new Date(p.due_date) < new Date()).reduce((a, p) => a + Number(p.amount) - Number(p.amount_paid), 0);

  const allIds = payables.map(p => p.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const TABS_P = [['all', 'Todos'], ['open', 'A pagar'], ['partial', 'Parcial'], ['closed', 'Pagos'], ['overdue', 'Vencidos']] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Títulos a pagar</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Títulos a pagar a instrutores e fornecedores</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
{can(PERM.PAYABLES.CREATE) && <button className={btnPrimary} onClick={() => setNewModal(true)}><Plus size={14} /> Novo título</button>}
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
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-danger-soft text-danger"><ArrowUpRight size={18} /></div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[12px] text-ink-3 font-medium">Valor pago</div>
            <div className="text-[20px] font-bold tracking-tight font-mono text-danger"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(paid)}</div>
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-warn-soft text-warn"><Hourglass size={18} /></div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[12px] text-ink-3 font-medium">Valor a pagar</div>
            <div className="text-[20px] font-bold tracking-tight font-mono text-warn"><span className="text-[13px] font-medium mr-0.5">R$</span>{formatBRL(total - paid)}</div>
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
            {TABS_P.map(([k, l]) => (
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
            <input className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[260px]" placeholder="Buscar por título ou recebedor" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {isLoading ? <div className="py-8 text-center text-[13px] text-ink-3">Carregando…</div> : (
          <>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
                <span className="flex-1" />
                {can(PERM.PAYABLES.DELETE) && (
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
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Recebedor</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Vencimento</th>
                    <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
                    <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Pago</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line w-32">Progresso</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Status</th>
                    <th className="px-3.5 py-2.5 bg-bg border-b border-line w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                      <td className="px-3.5 py-2.5 border-b border-line w-9" onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} /></td>
                      <td className="px-3.5 py-2.5 border-b border-line font-mono text-[11.5px]">{p.id}</td>
                      <td className="px-3.5 py-2.5 border-b border-line font-medium text-ink">{p.title}</td>
                      <td className="px-3.5 py-2.5 border-b border-line">{p.product ? <span className="inline-flex items-center px-1.5 py-px rounded-[3px] text-[11px] font-medium bg-bg-sunk text-ink-3 border border-line">{p.product}</span> : '—'}</td>
                      <td className="px-3.5 py-2.5 border-b border-line text-[12px] text-ink-3">{p.customer?.name ?? p.company?.name ?? p.instructor?.customer?.name ?? '—'}</td>
                      <td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{p.due_date ? formatDate(p.due_date) : '—'}</td>
                      <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(p.amount)}</td>
                      <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">{`R$ ${formatBRL(p.amount_paid)}`}</td>
                      <td className="px-3.5 py-2.5 border-b border-line w-32">
                        {(() => {
                          const pct = Number(p.amount) > 0 ? Math.min(100, (Number(p.amount_paid) / Number(p.amount)) * 100) : 0;
                          const color = p.status === 'closed' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--line)';
                          return (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 rounded-full bg-bg-sunk overflow-hidden">
                                <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 9999, transition: 'width 0.3s' }} />
                              </div>
                              <span className="text-[11px] font-mono text-ink-3 w-8 text-right">{Math.round(pct)}%</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-line">
                        <Badge variant={P_STATUS_BADGE[p.status] as 'success' | 'warn' | 'danger' | 'accent' | 'default' ?? 'default'}>{P_STATUS_LABEL[p.status] ?? p.status}</Badge>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-line w-10" onClick={e => e.stopPropagation()}>
                        <button className={iconBtn} onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuState(s => s?.id === p.id ? null : { id: p.id, top: r.bottom + 4, right: window.innerWidth - r.right }); }}><MoreHorizontal size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {payables.length === 0 && <tr><td colSpan={11} className="px-3.5 py-8 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
          </>
        )}
      </div>
      </div>

      {menuState && menuPayable && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => { setMenuState(null); navigate(`/payables/${menuPayable.id}`); }}><Eye size={14} /> Ver detalhes</button>
          {menuPayable.status !== 'closed' && can(PERM.PAYABLES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setPayPayable(menuPayable)}><CheckIcon size={14} /> Pagar</button>}
          {can(PERM.PAYABLES.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuPayable.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {newModal && <NewPayableModal customers={customers} instructors={instructors} partners={partners} employees={employees} planes={planes} companies={companies} onClose={() => setNewModal(false)} onSave={d => createPayable(d).then(() => { qc.invalidateQueries({ queryKey: ['payables'] }); setNewModal(false); }).catch((e: unknown) => toast.error(extractErrorMessage(e)))} />}
      {payPayable && <PayModal payable={payPayable} onClose={() => setPayPayable(null)} onSave={d => payMut.mutate(d)} />}
    </div>
  );
}
