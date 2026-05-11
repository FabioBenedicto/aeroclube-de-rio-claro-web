import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Trash2, Check as CheckIcon, FileSpreadsheet, Eye, X } from 'lucide-react';
import { getReceivables, createReceivable, updateReceivable, deleteReceivable, registerPayment } from '../../api/receivables';
import { downloadReport } from '../../api/export';
import { getCustomers } from '../../api/customers';
import { getPlanes } from '../../api/planes';
import { getCompanies } from '../../api/companies';
import DateInput from '../../components/DateInput';
import FilterPopover from '../../components/FilterPopover';
import { formatBRL, formatDate, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import type { Receivable, Plane, Customer, Company } from '../../types';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import SettleModal from '../../components/SettleModal';
import Badge from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

type InstructorOption = { id: number; name: string };

const TABS = [['all','Todos'],['0','Em aberto'],['partial','Parcial'],['1','Pagos'],['overdue','Vencidos']] as const;
type MenuState = { id: number; top: number; right: number };

const modalBase = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
const modalPanel = 'bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]';
const modalHead = 'flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3';
const modalBody = 'p-[18px] overflow-y-auto flex-1 flex flex-col gap-4';
const modalFoot = 'flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line';
const field = 'flex flex-col gap-1.5';
const lbl = 'text-[12px] font-medium text-ink-2';
const inp = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]';
const sel = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] cursor-pointer';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

function NewReceivableModal({ customers, instructors, partners, employees, planes, companies, onClose, onSave }: {
  customers: { id: number; name: string }[];
  instructors: InstructorOption[];
  partners: { id: number; name: string }[];
  employees: { id: number; name: string }[];
  planes: Plane[];
  companies: Company[];
  onClose: () => void;
  onSave: (d: unknown) => void;
}) {
  const [form, setForm] = useState({
    client_id: '', company_id: '', instructor_id: '', plane_id: '',
    partner_id: '', employee_id: '',
    title: '', description: '', product: 'voo',
    expiration_date: '', total_amount: '',
    recurrence: '', occurrences: '2',
    payer_type: 'none',
  });
  return (
    <div className={modalBase} onClick={onClose}>
      <div className={modalPanel} onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <h3 className="text-[15px] font-semibold m-0">Novo título a receber</h3>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={modalBody}>
          <div className={field}><label className={lbl}>Tipo</label>
            <select className={sel} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
              <option value="voo">Voo</option><option value="mensalidade">Mensalidade</option><option value="servico">Serviço</option><option value="outro">Outro</option>
            </select>
          </div>
          <div className={field}><label className={lbl}>Título</label>
            <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className={field}><label className={lbl}>Descrição</label>
            <textarea className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] resize-y min-h-[60px]" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}><label className={lbl}>Vencimento</label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
            </div>
            <div className={field}><label className={lbl}>Valor</label>
              <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                <input type="number" step="0.01" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" placeholder="0,00" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="border-t border-line pt-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2.5">Pagador</div>
            <div className={field}>
              <select className={sel} value={form.payer_type} onChange={e => setForm(f => ({ ...f, payer_type: e.target.value }))}>
                <option value="none">Nenhum</option>
                <option value="customer">Cliente</option>
                <option value="company">Empresa</option>
                <option value="instructor">Instrutor</option>
                <option value="partner">Sócio</option>
                <option value="employee">Funcionário</option>
              </select>
            </div>
          </div>
          <div className="border-t border-line pt-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2.5">Associações</div>
            <div className="grid grid-cols-2 gap-3">
              <div className={field}><label className={lbl}>Cliente</label>
                <select className={sel} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={field}><label className={lbl}>Empresa</label>
                <select className={sel} value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={field}><label className={lbl}>Instrutor</label>
                <select className={sel} value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className={field}><label className={lbl}>Aeronave</label>
                <select className={sel} value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''}</option>)}
                </select>
              </div>
              <div className={field}><label className={lbl}>Sócio</label>
                <select className={sel} value={form.partner_id} onChange={e => setForm(f => ({ ...f, partner_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className={field}><label className={lbl}>Funcionário</label>
                <select className={sel} value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="border-t border-line pt-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2.5">Recorrência</div>
            <div className="grid grid-cols-2 gap-3">
              <div className={field}><label className={lbl}>Repetir</label>
                <select className={sel} value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                  <option value="">Sem recorrência</option>
                  <option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="yearly">Anual</option>
                </select>
              </div>
              {form.recurrence && (
                <div className={field}><label className={lbl}>Nº de ocorrências</label>
                  <input type="number" className={inp + ' font-mono'} min={2} max={60} value={form.occurrences} onChange={e => setForm(f => ({ ...f, occurrences: e.target.value }))} />
                </div>
              )}
            </div>
            {form.recurrence && (
              <div className="text-[12px] text-ink-3 mt-1">
                Serão criados <strong>{form.occurrences}</strong> títulos com vencimentos {form.recurrence === 'monthly' ? 'mensais' : form.recurrence === 'weekly' ? 'semanais' : 'anuais'}, a partir da data informada.
              </div>
            )}
          </div>
        </div>
        <div className={modalFoot}>
          <button className={btnCancel} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} onClick={() => onSave({
            client_id: form.client_id ? Number(form.client_id) : undefined,
            company_id: form.company_id ? Number(form.company_id) : undefined,
            instructor_id: form.instructor_id ? Number(form.instructor_id) : undefined,
            plane_id: form.plane_id ? Number(form.plane_id) : undefined,
            partner_id: form.partner_id ? Number(form.partner_id) : undefined,
            employee_id: form.employee_id ? Number(form.employee_id) : undefined,
            title: form.title,
            description: form.description || undefined,
            product: form.product,
            expiration_date: form.expiration_date,
            total_amount: parseFloat(form.total_amount),
            payer_type: form.payer_type,
            recurrence: form.recurrence || undefined,
            occurrences: form.recurrence ? Number(form.occurrences) : undefined,
          })}>
            <CheckIcon size={14} /> Criar título
          </button>
        </div>
      </div>
    </div>
  );
}

function EditReceivableModal({ rec, onClose, onSave }: { rec: Receivable; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: rec.title, description: rec.description ?? '', expiration_date: rec.expiration_date?.slice(0, 10) ?? '', total_amount: String(rec.total_amount) });
  return (
    <div className={modalBase} onClick={onClose}>
      <div className={modalPanel} onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <div>
            <h3 className="text-[15px] font-semibold m-0">Editar título</h3>
            <div className="text-[11.5px] text-ink-3 mt-0.5">{rec.id} · {rec.customer?.name}</div>
          </div>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
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
          <div className={field}><label className={lbl}>Descrição</label>
            <textarea className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] resize-y min-h-[60px]" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className={modalFoot}>
          <button className={btnCancel} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} onClick={() => onSave({ title: form.title, description: form.description || undefined, expiration_date: form.expiration_date, total_amount: parseFloat(form.total_amount) })}><CheckIcon size={14} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function Receivables() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [tab, setTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  const { data: customersData } = useQuery({ queryKey: ['customers', '', 'all', 1], queryFn: () => getCustomers(undefined, undefined, 1, 9999) });
  const customers = customersData?.data ?? [];

  const { data: planesData } = useQuery({ queryKey: ['planes', 1], queryFn: () => getPlanes(1, 9999) });
  const planes: Plane[] = planesData?.data ?? [];

  const { data: instructorData } = useQuery({ queryKey: ['customers', '', 'instrutor', 1], queryFn: () => getCustomers(undefined, 'instrutor', 1, 9999) });
  const instructors: InstructorOption[] = (instructorData?.data ?? [])
    .filter((c: Customer) => c.instructors?.length > 0)
    .map((c: Customer) => ({ id: c.instructors[0].id, name: c.name }));

  const { data: partnerData } = useQuery({ queryKey: ['customers', '', 'socio', 1], queryFn: () => getCustomers(undefined, 'socio', 1, 9999) });
  const partners = (partnerData?.data ?? [])
    .filter((c: Customer) => c.partners?.length > 0)
    .map((c: Customer) => ({ id: c.partners[0].id, name: c.name }));

  const { data: employeeData } = useQuery({ queryKey: ['customers', '', 'funcionario', 1], queryFn: () => getCustomers(undefined, 'funcionario', 1, 9999) });
  const employees = (employeeData?.data ?? [])
    .filter((c: Customer) => (c.employees ?? []).length > 0)
    .map((c: Customer) => ({ id: c.employees![0].id, name: c.name }));

  const { data: companiesData } = useQuery({ queryKey: ['companies', '', 1], queryFn: () => getCompanies(undefined, 1, 9999) });
  const companies: Company[] = companiesData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['receivables', tab, debouncedSearch, dateFrom, dateTo, page],
    queryFn: () => getReceivables(tab === 'all' ? undefined : tab, debouncedSearch || undefined, dateFrom || undefined, dateTo || undefined, page),
  });
  const allRecs = data?.data ?? [];

  const deleteMut = useMutation({ mutationFn: deleteReceivable, onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }) });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deleteReceivable(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setSelected(new Set()); },
  });
  const payMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: unknown }) => registerPayment(id, d as { amount_received: number; payment_method?: string; payment_date?: string; notes?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setSettleRec(null); },
  });

  const menuRec = menuState ? allRecs.find(r => r.id === menuState.id) ?? null : null;

  const { data: kpiData } = useQuery({ queryKey: ['receivables', 'kpi'], queryFn: () => getReceivables(undefined, undefined, 1, 9999) });
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
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Contas a receber</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Títulos gerados por voos, mensalidades e serviços</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className={btnCancel} onClick={() => downloadReport(`/receivables/export?status=${tab === 'all' ? '' : tab}&search=${debouncedSearch}&date_from=${dateFrom}&date_to=${dateTo}`, 'contas-a-receber.xlsx')}>
            <FileSpreadsheet size={14} /> Relatório
          </button>
          {can(PERM.RECEIVABLES.CREATE) && <button className={btnPrimary} onClick={() => setNewModal(true)}><Plus size={14} /> Novo título</button>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[12px] text-ink-3 font-medium mb-1">Total emitido</div>
          <div className="text-[24px] font-bold tracking-tight font-mono"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(total)}</div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[12px] text-ink-3 font-medium mb-1">Já recebido</div>
          <div className="text-[24px] font-bold tracking-tight font-mono text-success"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(received)}</div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[12px] text-ink-3 font-medium mb-1">A receber</div>
          <div className="text-[24px] font-bold tracking-tight font-mono"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(total - received)}</div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <div className="text-[12px] text-ink-3 font-medium mb-1">Vencidos</div>
          <div className="text-[24px] font-bold tracking-tight font-mono text-danger"><span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(overdue)}</div>
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
          <FilterPopover activeCount={[dateFrom, dateTo].filter(Boolean).length} onClear={() => { setDateFrom(''); setDateTo(''); }}>
            <div className={field}><label className={lbl}>A partir de</label><DateInput value={dateFrom} onChange={setDateFrom} /></div>
            <div className={field}><label className={lbl}>Até</label><DateInput value={dateTo} onChange={setDateTo} /></div>
          </FilterPopover>
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[220px]" placeholder="Buscar por cliente ou título…" value={search} onChange={e => setSearch(e.target.value)} />
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
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line w-9"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">ID</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Título</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Tipo</th>
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
                        <td className="px-3.5 py-2.5 border-b border-line w-9" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} /></td>
                        <td className="px-3.5 py-2.5 border-b border-line font-mono text-[11.5px]">{r.id}</td>
                        <td className="px-3.5 py-2.5 border-b border-line">{r.title}</td>
                        <td className="px-3.5 py-2.5 border-b border-line">{r.product ? <span className="inline-flex items-center px-1.5 py-px rounded-[3px] text-[11px] font-medium bg-bg-sunk text-ink-3 border border-line">{r.product}</span> : '—'}</td>
                        <td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{formatDate(r.expiration_date)}</td>
                        <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(r.total_amount)}</td>
                        <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                        <td className="px-3.5 py-2.5 border-b border-line" style={{ minWidth: 120 }}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} /></div>
                            <span className="font-mono text-[11px] text-ink-3 min-w-[32px] text-right">{pct}%</span>
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
                  {allRecs.length === 0 && <tr><td colSpan={10} className="px-3.5 py-8 text-center text-ink-3">Nenhum título encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
          </>
        )}
      </div>

      {menuState && menuRec && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => { setMenuState(null); navigate(`/receivables/${menuRec.id}`); }}><Eye size={14} /> Ver detalhes</button>
          {can(PERM.RECEIVABLES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setEditRec(menuRec)}><Edit size={14} /> Editar</button>}
          {receivableStatus(menuRec) !== 'paid' && can(PERM.RECEIVABLES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setSettleRec(menuRec)}><CheckIcon size={14} /> Receber</button>}
          {can(PERM.RECEIVABLES.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuRec.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {newModal && <NewReceivableModal customers={customers} instructors={instructors} partners={partners} employees={employees} planes={planes} companies={companies} onClose={() => setNewModal(false)} onSave={d => createReceivable(d).then(() => { qc.invalidateQueries({ queryKey: ['receivables'] }); setNewModal(false); })} />}
      {editRec && <EditReceivableModal rec={editRec} onClose={() => setEditRec(null)} onSave={d => updateReceivable(editRec.id, d).then(() => { qc.invalidateQueries({ queryKey: ['receivables'] }); setEditRec(null); })} />}
      {settleRec && <SettleModal rec={settleRec} onClose={() => setSettleRec(null)} onSave={d => payMut.mutate({ id: settleRec.id, d })} />}
    </div>
  );
}
