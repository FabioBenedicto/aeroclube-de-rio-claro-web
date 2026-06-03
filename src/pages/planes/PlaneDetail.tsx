import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Edit, Plane, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { getPlane, updatePlane } from '../../api/planes';
import { getSettings } from '../../api/settings';
import { getPeoples } from '../../api/peoples';
import { getCompanies } from '../../api/companies';
import DateInput from '../../components/DateInput';
import { createFlight } from '../../api/flights';
import { createReceivable } from '../../api/receivables';
import { createPayable } from '../../api/payables';
import { formatBRL, formatDate, formatHours, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import FlightModal from '../flights/FlightModal';
import PlaneModal from './PlaneModal';
import Badge from '../../components/ui/Badge';
import { toast, extractErrorMessage } from '../../utils/toast';

type BadgeVariant = 'success' | 'warn' | 'danger' | 'accent' | 'default';
type TabKey = 'voos' | 'receber_assoc' | 'pagar_assoc';

const P_STATUS_LABEL: Record<string, string> = { open: 'A pagar', partial: 'Parcial', closed: 'Pago' };
const P_STATUS_BADGE: Record<string, string> = { open: 'warn', partial: 'accent', closed: 'success' };

const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';
const btnSecondary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';

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

  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: plane, isLoading } = useQuery({ queryKey: ['plane', planeId], queryFn: () => getPlane(planeId) });
  const { data: customersResponse } = useQuery({ queryKey: ['peoples'], queryFn: () => getPeoples(), enabled: flightModal });
  const customersData = customersResponse?.data ?? [];
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings, enabled: plane?.aircraft_type === 'glider' });
  const [gliderTooltip, setGliderTooltip] = useState<{ top: number; left: number } | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['plane', planeId] });

  const flightMut = useMutation({
    mutationFn: createFlight,
    onSuccess: () => { invalidate(); setFlightModal(false); },
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

  if (isLoading) return <div className="p-8 text-[13px] text-ink-3">Carregando…</div>;
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
  const assocReceivables = receivables.filter(r => r.payer_type != null && r.payer_type !== 'none');
  const assocPayables = payables.filter(p => p.payer_type != null && p.payer_type !== 'none');

  const totalHours   = flights.reduce((s, f) => s + (Number(f.total_hours)  || 0), 0);
  const totalRevenue = flights.reduce((s, f) => s + (Number(f.total_amount) || 0), 0);
  const totalExpense = payables.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/planes')}>
            <ChevronLeft size={15} /> Voltar
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0 font-mono">{plane.registration}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border leading-none ${plane.aircraft_type === 'glider' ? 'bg-bg-sunk text-ink-3 border-line' : 'bg-accent/8 text-accent border-accent/20'}`}>
              {plane.aircraft_type === 'glider' ? 'Planador' : 'Avião'}
            </span>
            {plane.model && <><span className="text-ink-3 text-[13px]">·</span><span className="text-[13px] text-ink-2">{plane.model}</span></>}
            <span className="text-ink-3 text-[13px]">·</span>
            {plane.aircraft_type !== 'glider' && plane.flight_hour_value != null
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
          <button className={btnSecondary} onClick={() => setEditPlaneModal(true)}><Edit size={14} /> Editar</button>
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-6">
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
          <button className={btnPrimary} onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); }}>Aplicar</button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Plane size={18} /></div>
            <div className="flex flex-col gap-0.5 min-w-0 w-full">
              <div className="text-[12px] text-ink-3 font-medium">Total de voos</div>
              <div className="text-[20px] font-bold tracking-tight leading-none">{flights.length}</div>
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3"><Clock size={18} /></div>
            <div className="flex flex-col gap-0.5 min-w-0 w-full">
              <div className="text-[12px] text-ink-3 font-medium">Total de horas de voo</div>
              <div className="text-[20px] font-bold tracking-tight leading-none font-mono">{totalHours.toFixed(1)}h</div>
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-success-soft text-success"><ArrowDownLeft size={18} /></div>
            <div className="flex flex-col gap-0.5 min-w-0 w-full">
              <div className="text-[12px] text-ink-3 font-medium">Receita gerada</div>
              <div className="text-[20px] font-bold tracking-tight leading-none font-mono text-success">R$ {formatBRL(totalRevenue)}</div>
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
            <button className={btnPrimary} onClick={() => setFlightModal(true)}><Plus size={14} /> Novo voo</button>
          )}
          {tab === 'receber_assoc' && (
            <button className={btnPrimary} onClick={() => setNewRecModal(true)}><Plus size={14} /> Novo título a receber</button>
          )}
          {tab === 'pagar_assoc' && (
            <button className={btnPrimary} onClick={() => setNewPayModal(true)}><Plus size={14} /> Novo título a pagar</button>
          )}
        </div>

        {tab === 'voos' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={thCls}>Cliente</th><th className={thCls}>Tipo</th><th className={thCls}>Rota</th>
                  <th className={thCls}>Início</th><th className={thNumCls}>Horas</th><th className={thNumCls}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {flights.length === 0 && <tr><td colSpan={6} className="px-3.5 py-6 text-center text-ink-3">Nenhum voo encontrado.</td></tr>}
                {flights.map(f => (
                  <tr key={f.id} className="hover:bg-bg-hover">
                    <td className={`${tdCls} font-medium`}>{f.customer?.name ?? `${f.customer_id}`}</td>
                    <td className={tdCls}>{f.type}</td>
                    <td className={`${tdCls} font-mono text-[12px]`}>{f.origin} → {f.destination}</td>
                    <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(f.start_date)}</td>
                    <td className={`${tdCls} text-right font-mono`}>{formatHours(f.total_hours)}</td>
                    <td className={`${tdCls} text-right font-mono`}>{f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'receber_assoc' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={thCls}>Título</th>
                  <th className={thCls}>Pagador</th>
                  <th className={thCls}>Vencimento</th>
                  <th className={thNumCls}>Valor</th>
                  <th className={thNumCls}>Recebido</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody>
                {assocReceivables.length === 0 && <tr><td colSpan={6} className="px-3.5 py-6 text-center text-ink-3">Nenhum título associado.</td></tr>}
                {assocReceivables.map(r => {
                  const st = receivableStatus(r);
                  const payerLabel: Record<string, string> = { customer: 'Cliente', company: 'Empresa', instructor: 'Instrutor', partner: 'Sócio', employee: 'Funcionário' };
                  const payerName = r.customer?.name ?? r.company?.name ?? r.instructor?.customer?.name ?? '—';
                  return (
                    <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/receivables/${r.id}`)}>
                      <td className={`${tdCls} font-medium`}>{r.title}</td>
                      <td className={tdCls}>
                        <div>{payerName}</div>
                        {r.payer_type && <div className="text-[11.5px] text-ink-3 mt-0.5">{payerLabel[r.payer_type] ?? r.payer_type}</div>}
                      </td>
                      <td className={`${tdCls} font-mono text-[12px]`}>{formatDate(r.expiration_date)}</td>
                      <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(r.total_amount)}</td>
                      <td className={`${tdCls} text-right font-mono`}>{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                      <td className={tdCls}><Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge></td>
                    </tr>
                  );
                })}
                {assocReceivables.length > 0 && (
                  <tr className="font-semibold bg-bg-sunk">
                    <td colSpan={3} className="px-3.5 py-2.5 text-right text-[12px] text-ink-3">Total</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(assocReceivables.reduce((s, r) => s + Number(r.total_amount), 0))}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(assocReceivables.reduce((s, r) => s + Number(r.amount_received), 0))}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'pagar_assoc' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={thCls}>Título</th>
                  <th className={thCls}>Recebedor</th>
                  <th className={thCls}>Vencimento</th>
                  <th className={thNumCls}>Valor</th>
                  <th className={thNumCls}>Pago</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody>
                {assocPayables.length === 0 && <tr><td colSpan={6} className="px-3.5 py-6 text-center text-ink-3">Nenhum título associado.</td></tr>}
                {assocPayables.map(p => {
                  const payerLabel: Record<string, string> = { customer: 'Cliente', company: 'Empresa', instructor: 'Instrutor', partner: 'Sócio', employee: 'Funcionário' };
                  const payerName = p.customer?.name ?? p.company?.name ?? p.instructor?.customer?.name ?? '—';
                  return (
                    <tr key={p.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/payables/${p.id}`)}>
                      <td className={`${tdCls} font-medium`}>{p.title}</td>
                      <td className={tdCls}>
                        <div>{payerName}</div>
                        {p.payer_type && <div className="text-[11.5px] text-ink-3 mt-0.5">{payerLabel[p.payer_type] ?? p.payer_type}</div>}
                      </td>
                      <td className={`${tdCls} font-mono text-[12px]`}>{p.due_date ? formatDate(p.due_date) : '—'}</td>
                      <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount)}</td>
                      <td className={`${tdCls} text-right font-mono`}>{Number(p.amount_paid) > 0 ? `R$ ${formatBRL(p.amount_paid)}` : '—'}</td>
                      <td className={tdCls}><Badge variant={(P_STATUS_BADGE[p.status] ?? 'default') as BadgeVariant}>{P_STATUS_LABEL[p.status] ?? p.status}</Badge></td>
                    </tr>
                  );
                })}
                {assocPayables.length > 0 && (
                  <tr className="font-semibold bg-bg-sunk">
                    <td colSpan={3} className="px-3.5 py-2.5 text-right text-[12px] text-ink-3">Total</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(assocPayables.reduce((s, p) => s + Number(p.amount), 0))}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(assocPayables.reduce((s, p) => s + Number(p.amount_paid), 0))}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {flightModal && (
        <FlightModal
          mode="new"
          customers={customersData}
          planes={[plane]}
          initialPlaneId={plane.id}
          onClose={() => setFlightModal(false)}
          onSave={(data) => flightMut.mutate(data)}
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
      {newRecModal && <NewReceivableForPlaneModal planeId={planeId} onClose={() => setNewRecModal(false)} onSave={d => newRecMut.mutate(d)} />}
      {newPayModal && <NewPayableForPlaneModal planeId={planeId} onClose={() => setNewPayModal(false)} onSave={d => newPayMut.mutate(d)} />}
      {gliderTooltip && settings && (
        <div
          className="fixed z-50 w-56 rounded-lg border border-line bg-bg-elev shadow-[var(--shadow)] px-3 py-2.5 pointer-events-none"
          style={{ top: gliderTooltip.top, left: gliderTooltip.left, transform: 'translateY(-100%)' }}
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
    </div>
  );
}

const modalBase = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
const modalPanel = 'bg-bg-elev border border-line rounded-[10px] w-full max-w-[420px] shadow-[var(--shadow)] flex flex-col';
const modalHead = 'flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3';
const modalBody = 'p-[18px] flex flex-col gap-4';
const modalFoot = 'flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line';
const field = 'flex flex-col gap-1.5';
const lbl = 'text-[12px] font-medium text-ink-2';
const inp = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]';
const btnC = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnP = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';
function NewReceivableForPlaneModal({ planeId, onClose, onSave }: { planeId: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: '', total_amount: '', expiration_date: '', product: 'servico' });
  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const { data: companiesData } = useQuery({ queryKey: ['companies', '', 1], queryFn: () => getCompanies(undefined, 1, 9999) });
  const [clientId, setClientId] = useState('');
  const [companyId, setCompanyId] = useState('');
  return (
    <div className={modalBase} onClick={onClose}>
      <div className={modalPanel} onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <h3 className="text-[15px] font-semibold m-0">Novo título a receber</h3>
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>✕</button>
        </div>
        <div className={modalBody}>
          <div className={field}><label className={lbl}>Título</label><input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}><label className={lbl}>Vencimento</label><DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} /></div>
            <div className={field}><label className={lbl}>Valor</label>
              <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                <input type="number" step="0.01" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className={field}><label className={lbl}>Cliente</label>
            <select className={inp + ' cursor-pointer'} value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Nenhum</option>
              {(customersData?.data ?? []).map((c: { id: number; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={field}><label className={lbl}>Empresa</label>
            <select className={inp + ' cursor-pointer'} value={companyId} onChange={e => setCompanyId(e.target.value)}>
              <option value="">Nenhuma</option>
              {(companiesData?.data ?? []).map((c: { id: number; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className={modalFoot}>
          <button className={btnC} onClick={onClose}>Cancelar</button>
          <button className={btnP} onClick={() => onSave({ title: form.title, total_amount: parseFloat(form.total_amount), expiration_date: form.expiration_date || undefined, product: form.product, plane_id: planeId, client_id: clientId ? Number(clientId) : undefined, company_id: companyId ? Number(companyId) : undefined })}>
            Criar título
          </button>
        </div>
      </div>
    </div>
  );
}

function NewPayableForPlaneModal({ planeId, onClose, onSave }: { planeId: number; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: '', amount: '', due_date: '', product: 'manutencao' });
  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const { data: companiesData } = useQuery({ queryKey: ['companies', '', 1], queryFn: () => getCompanies(undefined, 1, 9999) });
  const [clientId, setClientId] = useState('');
  const [companyId, setCompanyId] = useState('');
  return (
    <div className={modalBase} onClick={onClose}>
      <div className={modalPanel} onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <h3 className="text-[15px] font-semibold m-0">Novo título a pagar</h3>
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>✕</button>
        </div>
        <div className={modalBody}>
          <div className={field}><label className={lbl}>Título</label><input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}><label className={lbl}>Vencimento</label><DateInput value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} /></div>
            <div className={field}><label className={lbl}>Valor</label>
              <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                <input type="number" step="0.01" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className={field}><label className={lbl}>Cliente</label>
            <select className={inp + ' cursor-pointer'} value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Nenhum</option>
              {(customersData?.data ?? []).map((c: { id: number; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={field}><label className={lbl}>Empresa</label>
            <select className={inp + ' cursor-pointer'} value={companyId} onChange={e => setCompanyId(e.target.value)}>
              <option value="">Nenhuma</option>
              {(companiesData?.data ?? []).map((c: { id: number; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className={modalFoot}>
          <button className={btnC} onClick={onClose}>Cancelar</button>
          <button className={btnP} onClick={() => onSave({ title: form.title, amount: parseFloat(form.amount), due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined, product: form.product, plane_id: planeId, client_id: clientId ? Number(clientId) : undefined, company_id: companyId ? Number(companyId) : undefined })}>
            Criar título
          </button>
        </div>
      </div>
    </div>
  );
}
