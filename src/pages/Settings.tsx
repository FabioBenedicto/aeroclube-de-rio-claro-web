import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Pencil, Trash2, X } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import { getSettings, upsertSettings, getSicoobConfig, upsertSicoobConfig } from '../api/settings';
import { maskCNPJ } from '../utils/masks';
import { getPayableTypes, createPayableType, updatePayableType, deletePayableType } from '../api/payable-types';
import { getReceivableTypes, createReceivableType, updateReceivableType, deleteReceivableType } from '../api/receivable-types';
import { toast } from '../utils/toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { cn } from '../utils/cn';

const TABS = ['Geral', 'Tipos de Títulos a Receber', 'Tipos de Títulos a Pagar', 'Sicoob'] as const;
type Tab = typeof TABS[number];

interface TypeEntry { id: number; name: string; created_at: string; }

interface TypesTableProps {
  label: string;
  queryKey: string;
  queryFn: () => Promise<TypeEntry[]>;
  onCreate: (name: string) => Promise<TypeEntry>;
  onUpdate: (id: number, name: string) => Promise<TypeEntry>;
  onDelete: (id: number) => Promise<unknown>;
}

function TypesTable({ label, queryKey, queryFn, onCreate, onUpdate, onDelete }: TypesTableProps) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const { data: types = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn });

  const createMut = useMutation({
    mutationFn: ({ name }: { name: string }) => onCreate(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setNewName('');
      setAdding(false);
      toast.success('Tipo criado.');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => onUpdate(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setEditId(null);
      toast.success('Tipo atualizado.');
    },
  });

  const deleteMut = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      toast.success('Tipo excluído.');
    },
  });

  function startAdding() {
    setAdding(true);
    setTimeout(() => addInputRef.current?.focus(), 0);
  }

  function cancelAdding() { setAdding(false); setNewName(''); }

  function handleCreate() {
    const name = newName.trim();
    if (!name) { toast.error('Nome é obrigatório.'); return; }
    createMut.mutate({ name });
  }

  function startEdit(id: number, name: string) {
    setEditId(id);
    setEditName(name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function handleUpdate() {
    if (editId === null) return;
    const name = editName.trim();
    if (!name) { toast.error('Nome é obrigatório.'); return; }
    updateMut.mutate({ id: editId, name });
  }

  return (
    <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</div>
        {!adding && (
          <Button variant="default" onClick={startAdding}>
            <Plus size={13} /> Novo tipo
          </Button>
        )}
      </div>

      {isLoading ? (
        <table className="w-full border-collapse">
          <tbody><Skeleton.TableRows cols={3} rows={4} /></tbody>
        </table>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line bg-bg-sunk">
              <th className="text-left px-4 py-2.5 font-medium text-ink-2" colSpan={2}>Nome</th>
              <th className="text-left px-4 py-2.5 font-medium text-ink-2">Criado em</th>
              <th className="w-20 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-b border-line bg-accent-soft/30">
                <td className="px-4 py-2" colSpan={2}>
                  <input
                    ref={addInputRef}
                    className="w-full px-2.5 py-[6px] border border-accent rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:shadow-[0_0_0_3px_var(--focus)]"
                    placeholder="Nome do tipo"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') cancelAdding(); }}
                  />
                </td>
                <td className="px-4 py-2" colSpan={2}>
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="primary" onClick={handleCreate} disabled={createMut.isPending}>
                      <Check size={13} />
                    </Button>
                    <Button variant="icon" onClick={cancelAdding}>
                      <X size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {types.length === 0 && !adding && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[13px] text-ink-3">
                  Nenhum tipo cadastrado.
                </td>
              </tr>
            )}
            {types.map(type => (
              <tr key={type.id} className="border-b border-line last:border-0 hover:bg-bg-hover group">
                <td className="px-4 py-2.5" colSpan={2}>
                  {editId === type.id ? (
                    <input
                      ref={editInputRef}
                      className="w-full px-2.5 py-[5px] border border-accent rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:shadow-[0_0_0_3px_var(--focus)]"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditId(null); }}
                    />
                  ) : (
                    <span className="font-medium">{type.name}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-ink-3">
                  {new Date(type.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {editId === type.id ? (
                      <>
                        <Button variant="primary" onClick={handleUpdate} disabled={updateMut.isPending}>
                          <Check size={13} />
                        </Button>
                        <Button variant="icon" onClick={() => setEditId(null)}>
                          <X size={13} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="icon" onClick={() => startEdit(type.id, type.name)}>
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="icon"
                          className="text-danger hover:bg-danger-soft"
                          onClick={() => deleteMut.mutate(type.id)}
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('Geral');

  const { data: settings, isLoading: loadingSettings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const { data: sicoob, isLoading: loadingSicoob } = useQuery({ queryKey: ['sicoob-config'], queryFn: getSicoobConfig });

  const [instructorPct, setInstructorPct] = useState(0);
  const [monthlyFee, setMonthlyFee] = useState(0);
  const [gliderMinutes, setGliderMinutes] = useState(0);
  const [gliderInitialValue, setGliderInitialValue] = useState(0);
  const [gliderMinuteValue, setGliderMinuteValue] = useState(0);

  const [sicoobCnpj, setSicoobCnpj] = useState('');
  const [sicoobNome, setSicoobNome] = useState('AEROCLUBE DE RIO CLARO');
  const [sicoobPrefix, setSicoobPrefix] = useState('');
  const [sicoobPrefixDv, setSicoobPrefixDv] = useState('');
  const [sicoobConta, setSicoobConta] = useState('');
  const [sicoobContaDv, setSicoobContaDv] = useState('');
  const [sicoobCarteira, setSicoobCarteira] = useState('1');
  const [sicoobModalidade, setSicoobModalidade] = useState('01');
  const [sicoobJuros, setSicoobJuros] = useState(0);
  const [sicoobJurosPrazo, setSicoobJurosPrazo] = useState(0);
  const [sicoobJurosTipo, setSicoobJurosTipo] = useState('2');

  useEffect(() => {
    if (settings) {
      setInstructorPct(Number(settings.instructor_percentage));
      setMonthlyFee(Number(settings.partner_monthly_dues));
      setGliderMinutes(Number(settings.glider_initial_minutes));
      setGliderInitialValue(Number(settings.glider_initial_value));
      setGliderMinuteValue(Number(settings.glider_minute_value));
    }
  }, [settings]);

  useEffect(() => {
    if (sicoob) {
      setSicoobCnpj(sicoob.cnpj ?? '');
      setSicoobNome(sicoob.company_name ?? 'AEROCLUBE DE RIO CLARO');
      setSicoobPrefix(sicoob.cooperative_prefix ?? '');
      setSicoobPrefixDv(sicoob.cooperative_digit ?? '');
      setSicoobConta(sicoob.account ?? '');
      setSicoobContaDv(sicoob.account_digit ?? '');
      setSicoobCarteira(sicoob.wallet ?? '1');
      setSicoobModalidade(sicoob.modality ?? '01');
      setSicoobJuros(Number(sicoob.interest_rate ?? 0));
      setSicoobJurosPrazo(Number(sicoob.interest_period ?? 0));
      setSicoobJurosTipo(sicoob.interest_type ?? '2');
    }
  }, [sicoob]);

  const settingsMut = useMutation({
    mutationFn: upsertSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações salvas');
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  const sicoobMut = useMutation({
    mutationFn: upsertSicoobConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sicoob-config'] });
      toast.success('Configurações do Sicoob salvas');
    },
    onError: () => toast.error('Erro ao salvar configurações do Sicoob'),
  });

  function handleSaveSettings() {
    settingsMut.mutate({
      instructor_percentage: instructorPct,
      partner_monthly_dues: monthlyFee,
      glider_initial_minutes: gliderMinutes,
      glider_initial_value: gliderInitialValue,
      glider_minute_value: gliderMinuteValue,
    });
  }

  function handleSaveSicoob() {
    sicoobMut.mutate({
      cnpj: sicoobCnpj || undefined,
      company_name: sicoobNome || undefined,
      cooperative_prefix: sicoobPrefix || undefined,
      cooperative_digit: sicoobPrefixDv || undefined,
      account: sicoobConta || undefined,
      account_digit: sicoobContaDv || undefined,
      wallet: sicoobCarteira || undefined,
      modality: sicoobModalidade || undefined,
      interest_rate: sicoobJuros,
      interest_period: sicoobJurosPrazo,
      interest_type: sicoobJurosTipo,
    });
  }

  const moneyInp = 'flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none';
  const isLoading = loadingSettings || loadingSicoob;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Configurações</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Parâmetros do sistema</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer transition-[color,box-shadow] duration-[80ms] -mb-px',
              activeTab === tab
                ? 'text-accent-ink border-b-2 border-b-accent'
                : 'text-ink-3 hover:text-ink border-b-2 border-b-transparent',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Tipos de Títulos a Receber' ? (
        <TypesTable
          label="Tipos de Títulos a Receber"
          queryKey="receivable-types"
          queryFn={getReceivableTypes}
          onCreate={createReceivableType}
          onUpdate={updateReceivableType}
          onDelete={deleteReceivableType}
        />
      ) : activeTab === 'Tipos de Títulos a Pagar' ? (
        <TypesTable
          label="Tipos de Títulos a Pagar"
          queryKey="payable-types"
          queryFn={getPayableTypes}
          onCreate={createPayableType}
          onUpdate={updatePayableType}
          onDelete={deletePayableType}
        />
      ) : isLoading ? (
        <>
          <div className="bg-bg-elev border border-line rounded-lg p-6 flex flex-col gap-4">
            <Skeleton.Text width="w-20" />
            <Skeleton.Block className="h-[13px] w-3/4" />
            <Skeleton.Block className="h-10 w-full rounded-md" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton.Block className="h-10 rounded-md" />
              <Skeleton.Block className="h-10 rounded-md" />
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-6 flex flex-col gap-4">
            <Skeleton.Text width="w-16" />
            <Skeleton.Block className="h-10 w-[200px] rounded-md" />
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-6 flex flex-col gap-4">
            <Skeleton.Text width="w-24" />
            <Skeleton.Block className="h-10 w-full rounded-md" />
          </div>
        </>
      ) : activeTab === 'Geral' ? (
        <>
          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Planador</div>
            <p className="text-[12px] text-ink-3 mt-0 mb-4">
              Regra de cobrança: valor fixo para os minutos iniciais; após o limite, acrescenta valor por minuto excedente.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Minutos iniciais (franquia)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={120} step={1} value={gliderMinutes}
                    onChange={e => setGliderMinutes(Number(e.target.value))}
                    className="flex-1"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <Input
                    className="w-[80px] font-mono text-right"
                    type="number" min={0} step={1} value={gliderMinutes}
                    onChange={e => setGliderMinutes(Number(e.target.value))}
                  />
                  <span className="text-[13px] text-ink-3">min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Valor fixo inicial (R$)</label>
                  <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                    <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                    <input
                      className={moneyInp}
                      type="number" min={0} step="0.01" value={gliderInitialValue}
                      onChange={e => setGliderInitialValue(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Valor por minuto adicional (R$)</label>
                  <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                    <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                    <input
                      className={moneyInp}
                      type="number" min={0} step="0.01" value={gliderMinuteValue}
                      onChange={e => setGliderMinuteValue(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Sócios</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Mensalidade de sócios (R$)</label>
              <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] max-w-[200px]">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                <input
                  className={moneyInp}
                  type="number" step="0.01" value={monthlyFee}
                  onChange={e => setMonthlyFee(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Instrutores</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Porcentagem do instrutor (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={50} step={1} value={instructorPct}
                  onChange={e => setInstructorPct(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <Input
                  className="w-[80px] font-mono text-right"
                  type="number" min={0} max={50} step={1} value={instructorPct}
                  onChange={e => setInstructorPct(Number(e.target.value))}
                />
                <span className="text-[13px] text-ink-3">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={settingsMut.isPending}
              onClick={handleSaveSettings}
            >
              <Check size={14} /> {settingsMut.isPending ? 'Salvando…' : settingsMut.isSuccess ? 'Salvo!' : 'Salvar configurações'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Sicoob / CNAB 240</div>
            <p className="text-[12px] text-ink-3 mt-0 mb-6">
              Dados bancários para geração de remessa e importação de retorno CNAB 240.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 border-b border-line pb-2">Cooperativa</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Agência</label>
                    <Input
                      className="font-mono"
                      maxLength={5} value={sicoobPrefix}
                      onChange={e => setSicoobPrefix(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="00000"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">DV agência</label>
                    <Input
                      className="font-mono"
                      maxLength={1} value={sicoobPrefixDv}
                      onChange={e => setSicoobPrefixDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 border-b border-line pb-2">Beneficiário</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">CNPJ</label>
                    <Input
                      className="font-mono"
                      maxLength={18} value={maskCNPJ(sicoobCnpj)}
                      onChange={e => setSicoobCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Nome/Razão social</label>
                    <Input
                      maxLength={30} value={sicoobNome}
                      onChange={e => setSicoobNome(e.target.value.toUpperCase())}
                      placeholder=""
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Conta</label>
                    <Input
                      className="font-mono"
                      maxLength={12} value={sicoobConta}
                      onChange={e => setSicoobConta(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="000000000000"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">DV conta</label>
                    <Input
                      className="font-mono"
                      maxLength={1} value={sicoobContaDv}
                      onChange={e => setSicoobContaDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[12px] font-medium text-ink-2">Carteira / Modalidade</label>
                    <Select
                      value={`${sicoobCarteira}/${sicoobModalidade}`}
                      onChange={e => {
                        const [c, m] = e.target.value.split('/');
                        setSicoobCarteira(c);
                        setSicoobModalidade(m);
                      }}
                    >
                      <option value="1/01">1/01 — Cobrança Simples</option>
                      <option value="2/04">2/04 — Cobrança Vinculada</option>
                      <option value="3/03">3/03 — Cobrança Caucionada</option>
                      <option value="1/05">1/05 — Carnê de Pagamentos</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 border-b border-line pb-2">Juros</div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Tipo de juros</label>
                    <Select
                      value={sicoobJurosTipo}
                      onChange={e => setSicoobJurosTipo(e.target.value)}
                    >
                      <option value="0">Isento</option>
                      <option value="1">Valor por dia (R$)</option>
                      <option value="2">Taxa mensal (%)</option>
                    </Select>
                  </div>
                  {sicoobJurosTipo !== '0' && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-ink-2">
                          {sicoobJurosTipo === '1' ? 'Valor por dia (R$)' : 'Taxa mensal (%)'}
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={sicoobJurosTipo === '2' ? 100 : undefined}
                          className="font-mono"
                          value={sicoobJuros}
                          onChange={e => setSicoobJuros(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-ink-2">Prazo de juros (dias após venc.)</label>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className="font-mono"
                          value={sicoobJurosPrazo}
                          onChange={e => setSicoobJurosPrazo(parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={sicoobMut.isPending}
              onClick={handleSaveSicoob}
            >
              <Check size={14} /> {sicoobMut.isPending ? 'Salvando…' : sicoobMut.isSuccess ? 'Salvo!' : 'Salvar Sicoob'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
