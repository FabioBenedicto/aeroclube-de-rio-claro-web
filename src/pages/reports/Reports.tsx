import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, Download, Plus, X, BarChart2, Code } from 'lucide-react';
import { runQuery, exportQuery, runRawQuery, exportRawQuery } from '../../api/reports';
import type { QueryReportPayload } from '../../api/reports';
import { formatBRL, formatDate } from '../../utils/format';
import { toast } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

type FieldType = 'string' | 'number' | 'date' | 'enum';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  enumValues?: { value: string; label: string }[];
  groupable?: boolean;
  aggregatable?: boolean;
}

const ENTITY_SCHEMAS: Record<string, FieldDef[]> = {
  receivable: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'title', label: 'Título', type: 'string', groupable: true },
    { key: 'description', label: 'Descrição', type: 'string' },
    { key: 'receivable_type_name', label: 'Tipo', type: 'string', groupable: true },
    { key: 'total_amount', label: 'Valor total', type: 'number', aggregatable: true },
    { key: 'amount_received', label: 'Valor recebido', type: 'number', aggregatable: true },
    { key: 'status', label: 'Status', type: 'enum', groupable: true, enumValues: [
      { value: 'PENDING', label: 'A receber' }, { value: 'PARTIAL', label: 'Parcial' },
      { value: 'PAID', label: 'Pago' }, { value: 'OVERDUE', label: 'Vencido' },
    ]},
    { key: 'expiration_date', label: 'Vencimento', type: 'date', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
    { key: 'stakeholder', label: 'Tipo de pagador', type: 'enum', groupable: true, enumValues: [
      { value: 'PEOPLE', label: 'Cliente' }, { value: 'COMPANY', label: 'Empresa' }, { value: 'INSTRUCTOR', label: 'Instrutor' },
      { value: 'PARTNER', label: 'Sócio' }, { value: 'EMPLOYEE', label: 'Funcionário' }, { value: 'NONE', label: 'Nenhum' },
    ]},
    { key: 'person_name', label: 'Cliente', type: 'string' },
    { key: 'company_name', label: 'Empresa', type: 'string' },
  ],
  payable: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'title', label: 'Título', type: 'string', groupable: true },
    { key: 'description', label: 'Descrição', type: 'string' },
    { key: 'payable_type_name', label: 'Tipo', type: 'string', groupable: true },
    { key: 'total_amount', label: 'Valor', type: 'number', aggregatable: true },
    { key: 'amount_paid', label: 'Valor pago', type: 'number', aggregatable: true },
    { key: 'status', label: 'Status', type: 'enum', groupable: true, enumValues: [
      { value: 'PENDING', label: 'Em aberto' }, { value: 'PARTIAL', label: 'Parcial' },
      { value: 'PAID', label: 'Pago' }, { value: 'OVERDUE', label: 'Vencido' },
    ]},
    { key: 'expiration_date', label: 'Vencimento', type: 'date', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
    { key: 'stakeholder', label: 'Tipo', type: 'enum', groupable: true, enumValues: [
      { value: 'PEOPLE', label: 'Cliente' }, { value: 'COMPANY', label: 'Empresa' }, { value: 'INSTRUCTOR', label: 'Instrutor' },
      { value: 'PARTNER', label: 'Sócio' }, { value: 'EMPLOYEE', label: 'Funcionário' }, { value: 'NONE', label: 'Nenhum' },
    ]},
    { key: 'person_name', label: 'Cliente', type: 'string' },
    { key: 'company_name', label: 'Empresa', type: 'string' },
  ],
  flight: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'type', label: 'Tipo', type: 'string', groupable: true },
    { key: 'origin', label: 'Origem', type: 'string', groupable: true },
    { key: 'destination', label: 'Destino', type: 'string', groupable: true },
    { key: 'start_date', label: 'Início', type: 'date', groupable: true },
    { key: 'end_date', label: 'Fim', type: 'date' },
    { key: 'total_hours', label: 'Horas', type: 'number', aggregatable: true },
    { key: 'total_amount', label: 'Valor', type: 'number', aggregatable: true },
    { key: 'pilot_name', label: 'Piloto', type: 'string' },
    { key: 'aircraft_registration', label: 'Aeronave', type: 'string' },
    { key: 'instructor_name', label: 'Instrutor', type: 'string' },
  ],
  people: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'name', label: 'Nome', type: 'string', groupable: true },
    { key: 'cpf', label: 'CPF', type: 'string', groupable: true },
    { key: 'email', label: 'E-mail', type: 'string', groupable: true },
    { key: 'phone_number', label: 'Telefone', type: 'string' },
    { key: 'credit_balance', label: 'Saldo de crédito', type: 'number', aggregatable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
  bill: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'total_amount', label: 'Valor total', type: 'number', aggregatable: true },
    { key: 'expiration_date', label: 'Vencimento', type: 'date', groupable: true },
    { key: 'payment_date', label: 'Pago em', type: 'date' },
    { key: 'status', label: 'Status', type: 'enum', groupable: true, enumValues: [
      { value: 'open', label: 'Em aberto' }, { value: 'pending_cnab', label: 'Pendente CNAB' },
      { value: 'paid', label: 'Pago' }, { value: 'cancelled', label: 'Cancelado' },
    ]},
    { key: 'payment_method', label: 'Forma de pagamento', type: 'string', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
    { key: 'people_name', label: 'Cliente', type: 'string' },
  ],
  receivablePayment: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'amount', label: 'Valor recebido', type: 'number', aggregatable: true },
    { key: 'method', label: 'Forma de pagamento', type: 'string', groupable: true },
    { key: 'payment_date', label: 'Data', type: 'date', groupable: true },
    { key: 'receivable_title', label: 'Título', type: 'string' },
    { key: 'person_name', label: 'Cliente', type: 'string' },
  ],
  payablePayment: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'amount', label: 'Valor pago', type: 'number', aggregatable: true },
    { key: 'method', label: 'Forma de pagamento', type: 'string', groupable: true },
    { key: 'payment_date', label: 'Data', type: 'date', groupable: true },
    { key: 'payable_title', label: 'Título', type: 'string' },
    { key: 'person_name', label: 'Cliente', type: 'string' },
  ],
  company: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'name', label: 'Nome', type: 'string', groupable: true },
    { key: 'cnpj', label: 'CNPJ', type: 'string' },
    { key: 'email', label: 'E-mail', type: 'string' },
    { key: 'phone', label: 'Telefone', type: 'string' },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
  partner: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'people_name', label: 'Sócio', type: 'string' },
    { key: 'people_cpf', label: 'CPF', type: 'string' },
    { key: 'monthly_dues', label: 'Mensalidade', type: 'number', aggregatable: true },
    { key: 'next_due_date', label: 'Próximo vencimento', type: 'date', groupable: true },
    { key: 'last_payment_date', label: 'Último pagamento', type: 'date' },
    { key: 'status', label: 'Status', type: 'enum', groupable: true, enumValues: [
      { value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' },
    ]},
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
  instructor: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
    { key: 'people_name', label: 'Nome', type: 'string' },
    { key: 'people_cpf', label: 'CPF', type: 'string' },
    { key: 'people_email', label: 'E-mail', type: 'string' },
  ],
  aircraft: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'registration', label: 'Matrícula', type: 'string', groupable: true },
    { key: 'model', label: 'Modelo', type: 'string', groupable: true },
    { key: 'type', label: 'Tipo', type: 'string', groupable: true },
    { key: 'flight_hour_value', label: 'Valor hora/voo', type: 'number', aggregatable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
  receivableType: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'name', label: 'Nome', type: 'string', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
  payableType: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'name', label: 'Nome', type: 'string', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
  address: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'street', label: 'Rua', type: 'string' },
    { key: 'neighborhood', label: 'Bairro', type: 'string', groupable: true },
    { key: 'city', label: 'Cidade', type: 'string', groupable: true },
    { key: 'state', label: 'Estado', type: 'string', groupable: true },
    { key: 'zip_code', label: 'CEP', type: 'string' },
    { key: 'people_name', label: 'Pessoa', type: 'string' },
  ],
  student: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
    { key: 'people_name', label: 'Nome', type: 'string' },
    { key: 'people_cpf', label: 'CPF', type: 'string' },
    { key: 'people_email', label: 'E-mail', type: 'string' },
  ],
  employee: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
    { key: 'people_name', label: 'Nome', type: 'string' },
    { key: 'people_cpf', label: 'CPF', type: 'string' },
    { key: 'people_email', label: 'E-mail', type: 'string' },
  ],
  cnabRemessa: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'sequence_number', label: 'Sequência', type: 'number' },
    { key: 'bill_count', label: 'Qtd. faturas', type: 'number', aggregatable: true },
    { key: 'total_amount', label: 'Valor total', type: 'number', aggregatable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
  file: [
    { key: 'id', label: 'ID', type: 'number', groupable: true },
    { key: 'original_name', label: 'Nome do arquivo', type: 'string' },
    { key: 'mime_type', label: 'Tipo', type: 'string', groupable: true },
    { key: 'size', label: 'Tamanho (bytes)', type: 'number', aggregatable: true },
    { key: 'created_at', label: 'Criado em', type: 'date', groupable: true },
  ],
};

const ENTITIES = [
  { value: 'receivable',        label: 'Títulos a receber' },
  { value: 'payable',           label: 'Títulos a pagar' },
  { value: 'receivablePayment', label: 'Recebimentos' },
  { value: 'payablePayment',    label: 'Pagamentos efetuados' },
  { value: 'bill',              label: 'Faturas' },
  { value: 'flight',            label: 'Voos' },
  { value: 'people',            label: 'Pessoas' },
  { value: 'company',           label: 'Empresas' },
  { value: 'partner',           label: 'Sócios' },
  { value: 'instructor',        label: 'Instrutores' },
  { value: 'aircraft',          label: 'Aeronaves' },
  { value: 'receivableType',    label: 'Tipos de recebível' },
  { value: 'payableType',       label: 'Tipos de pagável' },
  { value: 'address',           label: 'Endereços' },
  { value: 'student',           label: 'Alunos' },
  { value: 'employee',          label: 'Funcionários' },
  { value: 'cnabRemessa',       label: 'Remessas CNAB' },
  { value: 'file',              label: 'Arquivos' },
];

interface JoinOption { value: string; label: string; entity: string; }

const JOIN_OPTIONS: Record<string, JoinOption[]> = {
  receivable:        [
    { value: 'people',   label: 'Pessoa',   entity: 'people'   },
    { value: 'company',  label: 'Empresa',  entity: 'company'  },
    { value: 'aircraft', label: 'Aeronave', entity: 'aircraft' },
    { value: 'flight',   label: 'Voo',      entity: 'flight'   },
  ],
  payable:           [
    { value: 'people',   label: 'Pessoa',   entity: 'people'   },
    { value: 'company',  label: 'Empresa',  entity: 'company'  },
    { value: 'aircraft', label: 'Aeronave', entity: 'aircraft' },
  ],
  flight:            [
    { value: 'people',   label: 'Piloto',   entity: 'people'   },
    { value: 'aircraft', label: 'Aeronave', entity: 'aircraft' },
  ],
  people:            [],
  bill:              [{ value: 'people', label: 'Pessoa', entity: 'people' }],
  receivablePayment: [],
  payablePayment:    [],
  company:           [],
  partner:           [{ value: 'people', label: 'Pessoa', entity: 'people' }],
  instructor:        [{ value: 'people', label: 'Pessoa', entity: 'people' }],
  aircraft:          [],
  receivableType:    [],
  payableType:       [],
  address:           [],
  student:           [],
  employee:          [],
  cnabRemessa:       [],
  file:              [],
};

function getJoinedFields(joinKey: string, joinLabel: string, joinEntity: string): FieldDef[] {
  return (ENTITY_SCHEMAS[joinEntity] ?? []).map(f => ({
    ...f,
    key: `${joinKey}.${f.key}`,
    label: f.label,
    groupable: false,
    aggregatable: false,
  }));
}

const OPERATORS: Record<FieldType, { value: string; label: string }[]> = {
  string: [
    { value: 'contains', label: 'Contém' },
    { value: 'eq', label: 'É igual a' },
    { value: 'neq', label: 'É diferente de' },
    { value: 'is_null', label: 'Está vazio' },
    { value: 'is_not_null', label: 'Não está vazio' },
  ],
  number: [
    { value: 'eq', label: 'Igual a' },
    { value: 'neq', label: 'Diferente de' },
    { value: 'gte', label: 'Maior ou igual a' },
    { value: 'lte', label: 'Menor ou igual a' },
    { value: 'gt', label: 'Maior que' },
    { value: 'lt', label: 'Menor que' },
    { value: 'is_null', label: 'Está vazio' },
    { value: 'is_not_null', label: 'Não está vazio' },
  ],
  date: [
    { value: 'gte', label: 'A partir de' },
    { value: 'lte', label: 'Até' },
    { value: 'eq', label: 'É igual a' },
    { value: 'gt', label: 'Depois de' },
    { value: 'lt', label: 'Antes de' },
    { value: 'is_null', label: 'Está vazio' },
    { value: 'is_not_null', label: 'Não está vazio' },
  ],
  enum: [
    { value: 'eq', label: 'É igual a' },
    { value: 'neq', label: 'É diferente de' },
    { value: 'is_null', label: 'Está vazio' },
    { value: 'is_not_null', label: 'Não está vazio' },
  ],
};

const AGG_FNS = [
  { value: 'sum', label: 'Soma' },
  { value: 'count', label: 'Contagem' },
  { value: 'avg', label: 'Média' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
];

interface FilterRowState { id: string; field: string; operator: string; value: string; }
interface AggRowState { id: string; field: string; fn: string; alias: string; }

let _uid = 0;
const uid = () => String(++_uid);
const needsValue = (op: string) => !['is_null', 'is_not_null'].includes(op);

function extractErrorMessage(e: any): string {
  const data = e?.response?.data;
  if (!data) return e?.message ?? 'Erro desconhecido';
  const msg = data.message;
  if (Array.isArray(msg)) return msg.join('\n');
  if (typeof msg === 'string') return msg;
  return data.error ?? 'Erro desconhecido';
}

const sectionHdr = 'text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3';
const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line whitespace-nowrap';

function formatCell(value: any, key: string, schema: FieldDef[], rawMode = false): string {
  if (value === null || value === undefined) return '—';
  if (rawMode) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDate(value);
    return String(value);
  }
  const f = schema.find(s => s.key === key);
  if (f?.type === 'date' && typeof value === 'string') return formatDate(value);
  if (f?.type === 'number' || (typeof value === 'number' && (key.includes('amount') || key.includes('balance') || key.includes('valor')))) {
    return typeof value === 'number' ? `R$ ${formatBRL(value)}` : String(value);
  }
  if (f?.type === 'enum' && f.enumValues) {
    const match = f.enumValues.find(ev => ev.value === String(value));
    if (match) return match.label;
  }
  return String(value);
}

export default function Reports() {
  const [mode, setMode] = useState<'builder' | 'sql'>('builder');

  // builder state
  const [entity, setEntity] = useState('receivable');
  const [columns, setColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterRowState[]>([]);
  const [useGroupBy, setUseGroupBy] = useState(false);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<AggRowState[]>([]);
  const [joins, setJoins] = useState<string[]>([]);

  // sql state
  const [sql, setSql] = useState('SELECT\n  *\nFROM "Receivable"\nLIMIT 50');

  const [results, setResults] = useState<Record<string, any>[] | null>(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const schema = ENTITY_SCHEMAS[entity] ?? [];

  const mergedSchema: FieldDef[] = [
    ...schema,
    ...joins.flatMap(j => {
      const opt = (JOIN_OPTIONS[entity] ?? []).find(o => o.value === j);
      return opt ? getJoinedFields(j, opt.label, opt.entity) : [];
    }),
  ];

  function changeEntity(e: string) {
    setEntity(e); setColumns([]); setFilters([]); setJoins([]);
    setGroupBy([]); setAggregations([]); setResults(null);
  }

  function toggleColumn(key: string, checked: boolean) {
    setColumns(c => checked ? [...c, key] : c.filter(x => x !== key));
  }

  function toggleGroupBy(key: string, checked: boolean) {
    setGroupBy(g => checked ? [...g, key] : g.filter(x => x !== key));
  }

  function addFilter() {
    const first = mergedSchema[0];
    if (!first) return;
    const ops = OPERATORS[first.type];
    setFilters(f => [...f, { id: uid(), field: first.key, operator: ops[0].value, value: '' }]);
  }

  function updateFilter(id: string, patch: Partial<FilterRowState>) {
    setFilters(fs => fs.map(f => f.id === id ? { ...f, ...patch } : f));
  }

  function changeFilterField(id: string, field: string) {
    const def = mergedSchema.find(s => s.key === field);
    const ops = OPERATORS[def?.type ?? 'string'];
    updateFilter(id, { field, operator: ops[0].value, value: '' });
  }

  function addAgg() {
    const numField = schema.find(f => f.aggregatable);
    setAggregations(a => [...a, { id: uid(), field: numField?.key ?? 'id', fn: 'sum', alias: '' }]);
  }

  function buildPayload(targetPage = page): QueryReportPayload {
    return {
      entity,
      joins: joins.length > 0 ? joins : undefined,
      columns: useGroupBy ? [] : columns,
      filters: filters
        .filter(f => f.field && f.operator)
        .map(f => ({
          field: f.field,
          operator: f.operator,
          value: needsValue(f.operator) ? f.value || undefined : undefined,
        })),
      groupBy: useGroupBy && groupBy.length ? groupBy : undefined,
      aggregations: useGroupBy && aggregations.length
        ? aggregations.filter(a => a.fn && a.alias).map(a => ({ field: a.fn === 'count' ? 'id' : a.field, fn: a.fn, alias: a.alias }))
        : undefined,
      limit: pageSize,
      page: targetPage,
    };
  }

  const runMut = useMutation({
    mutationFn: (p: QueryReportPayload) => runQuery(p),
    onSuccess: data => { setResults(data); setPage(1); },
    onError: (e: any) => toast.error(extractErrorMessage(e)),
  });

  const rawMut = useMutation({
    mutationFn: (s: string) => runRawQuery({ sql: s }),
    onSuccess: data => { setResults(data); setPage(1); },
    onError: (e: any) => toast.error(extractErrorMessage(e)),
  });

  const canRun = mode === 'sql'
    ? sql.trim().length > 0
    : useGroupBy
      ? (groupBy.length > 0 || aggregations.length > 0)
      : columns.length > 0;

  const isPending = runMut.isPending || rawMut.isPending;

  function handleRun() {
    setResults(null);
    if (mode === 'sql') rawMut.mutate(sql);
    else runMut.mutate(buildPayload(1));
  }

  function handleGoToPage(p: number) {
    setPage(p);
    setResults(null);
    runMut.mutate(buildPayload(p));
  }

  async function handleExport() {
    setExporting(true);
    try {
      let blob: Blob;
      if (mode === 'sql') {
        blob = await exportRawQuery({ sql });
      } else {
        blob = await exportQuery(buildPayload());
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
      a.href = url; a.download = `relatorio_${ts}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(extractErrorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  const resultKeys = results && results.length > 0 ? Object.keys(results[0]) : [];
  const getLabel = (key: string) => {
    if (mode === 'sql') return key;
    const f = mergedSchema.find(s => s.key === key);
    if (f) return f.label;
    return aggregations.find(a => a.alias === key)?.alias ?? key;
  };

  const hasNextPage = results !== null && results.length >= pageSize;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Relatórios</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Consultas personalizáveis sobre os dados do sistema</p>
        </div>
        <div className="flex items-center gap-1 bg-bg-elev border border-line rounded-lg p-1">
          {([['builder', 'Query Builder', BarChart2], ['sql', 'SQL', Code]] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => { setMode(val); setResults(null); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium border-0 cursor-pointer transition-colors whitespace-nowrap ${mode === val ? 'bg-accent text-white' : 'bg-transparent text-ink-3 hover:bg-bg-hover hover:text-ink'}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* ── Builder panel ── */}
        {mode === 'sql' ? (
          <div className="flex flex-col gap-3 w-[480px] flex-shrink-0">
            <div className="bg-bg-elev border border-line rounded-lg p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className={sectionHdr}>Consulta SQL</div>
                <span className="text-[11px] text-ink-3">somente SELECT</span>
              </div>
              <textarea
                className="w-full px-3 py-2.5 border border-line rounded-md bg-bg text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100 font-mono resize-y"
                rows={16}
                value={sql}
                onChange={e => setSql(e.target.value)}
                spellCheck={false}
                placeholder="SELECT * FROM ..."
              />
            </div>
            <Button
              disabled={!canRun || isPending}
              onClick={handleRun}
            >
              <Play size={13} /> {isPending ? 'Executando…' : 'Executar'}
            </Button>
          </div>
        ) : (
        <div className="flex flex-col gap-3 w-[340px] flex-shrink-0">

          {/* Entity */}
          <div className="bg-bg-elev border border-line rounded-lg p-4 flex flex-col gap-2.5">
            <div className={sectionHdr}>Fonte de dados</div>
            <Select value={entity} onChange={e => changeEntity(e.target.value)}>
              {ENTITIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </Select>
          </div>

          {/* Columns + Joins inline */}
          {!useGroupBy && (
            <div className="bg-bg-elev border border-line rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={sectionHdr}>Colunas</div>
                <div className="flex gap-2">
                  <button className="text-[11px] text-accent bg-transparent border-0 cursor-pointer hover:underline" onClick={() => setColumns(mergedSchema.map(f => f.key))}>Todas</button>
                  <button className="text-[11px] text-ink-3 bg-transparent border-0 cursor-pointer hover:underline" onClick={() => setColumns([])}>Nenhuma</button>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-4 mb-0.5">{ENTITIES.find(e => e.value === entity)?.label}</div>
                {schema.map(f => (
                  <label key={f.key} className="flex items-center gap-2 py-0.5 cursor-pointer select-none">
                    <Checkbox checked={columns.includes(f.key)} onChange={e => toggleColumn(f.key, e.target.checked)} />
                    <span className="text-[13px]">{f.label}</span>
                  </label>
                ))}
                {(JOIN_OPTIONS[entity] ?? []).map(opt => {
                  const active = joins.includes(opt.value);
                  const jFields = getJoinedFields(opt.value, opt.label, opt.entity);
                  return (
                    <div key={opt.value} className="mt-2">
                      <label className="flex items-center gap-2 py-0.5 cursor-pointer select-none">
                        <Checkbox
                          checked={active}
                          onChange={e => {
                            setJoins(j => e.target.checked ? [...j, opt.value] : j.filter(x => x !== opt.value));
                            if (!e.target.checked) {
                              setColumns(c => c.filter(col => !col.startsWith(`${opt.value}.`)));
                              setFilters(f => f.filter(fi => !fi.field.startsWith(`${opt.value}.`)));
                            }
                          }}
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-3">{opt.label}</span>
                      </label>
                      {active && (
                        <div className="ml-5 flex flex-col gap-0.5 mt-0.5">
                          {jFields.map(f => (
                            <label key={f.key} className="flex items-center gap-2 py-0.5 cursor-pointer select-none">
                              <Checkbox checked={columns.includes(f.key)} onChange={e => toggleColumn(f.key, e.target.checked)} />
                              <span className="text-[13px]">{f.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={sectionHdr}>Filtros</div>
              <button className="inline-flex items-center gap-1 text-[11px] text-accent bg-transparent border-0 cursor-pointer hover:underline" onClick={addFilter}>
                <Plus size={11} /> Adicionar
              </button>
            </div>
            {filters.length === 0 && <p className="text-[12px] text-ink-3 text-center py-2 m-0">Sem filtros ativos.</p>}
            <div className="flex flex-col gap-2">
              {filters.map(filter => {
                const def = mergedSchema.find(s => s.key === filter.field);
                const ops = OPERATORS[def?.type ?? 'string'];
                return (
                  <div key={filter.id} className="flex flex-col gap-1.5 p-2.5 border border-line rounded-md bg-bg">
                    <div className="flex items-center gap-1.5">
                      <select className="flex-1 min-w-0 px-2 py-[6px] border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent cursor-pointer" value={filter.field} onChange={e => changeFilterField(filter.id, e.target.value)}>
                        {mergedSchema.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                      <button className="p-1 text-ink-3 hover:text-danger bg-transparent border-0 cursor-pointer" onClick={() => setFilters(fs => fs.filter(f => f.id !== filter.id))}>
                        <X size={13} />
                      </button>
                    </div>
                    <select className="px-2 py-[6px] border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent cursor-pointer w-full" value={filter.operator} onChange={e => updateFilter(filter.id, { operator: e.target.value, value: '' })}>
                      {ops.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                    </select>
                    {needsValue(filter.operator) && (
                      def?.type === 'enum' ? (
                        <select className="px-2 py-[6px] border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent cursor-pointer w-full" value={filter.value} onChange={e => updateFilter(filter.id, { value: e.target.value })}>
                          <option value="">Selecione…</option>
                          {def.enumValues?.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                        </select>
                      ) : (
                        <input
                          type={def?.type === 'number' ? 'number' : def?.type === 'date' ? 'date' : 'text'}
                          className="px-2 py-[6px] border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent w-full"
                          value={filter.value}
                          onChange={e => updateFilter(filter.id, { value: e.target.value })}
                          placeholder={def?.type === 'number' ? '0' : def?.type === 'date' ? '' : 'Valor…'}
                        />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grouping */}
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={sectionHdr}>Agrupamento</div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox checked={useGroupBy} onChange={e => { setUseGroupBy(e.target.checked); if (!e.target.checked) { setGroupBy([]); setAggregations([]); } }} />
                <span className="text-[12px] text-ink-2">Ativar</span>
              </label>
            </div>
            {!useGroupBy && <p className="text-[12px] text-ink-3 text-center py-1 m-0">Ative para agrupar e agregar resultados.</p>}
            {useGroupBy && (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-[11px] font-medium text-ink-2 mb-1.5">Agrupar por</div>
                  <div className="flex flex-col gap-0.5">
                    {schema.filter(f => f.groupable).map(f => (
                      <label key={f.key} className="flex items-center gap-2 py-0.5 cursor-pointer select-none">
                        <Checkbox checked={groupBy.includes(f.key)} onChange={e => toggleGroupBy(f.key, e.target.checked)} />
                        <span className="text-[13px]">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[11px] font-medium text-ink-2">Agregações</div>
                    <button className="inline-flex items-center gap-1 text-[11px] text-accent bg-transparent border-0 cursor-pointer hover:underline" onClick={addAgg}>
                      <Plus size={11} /> Adicionar
                    </button>
                  </div>
                  {aggregations.length === 0 && <p className="text-[12px] text-ink-3 text-center py-1 m-0">Nenhuma agregação.</p>}
                  <div className="flex flex-col gap-2">
                    {aggregations.map(agg => (
                      <div key={agg.id} className="flex flex-col gap-1.5 p-2.5 border border-line rounded-md bg-bg">
                        <div className="flex items-center gap-1.5">
                          <select className="flex-1 min-w-0 px-2 py-[6px] border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent cursor-pointer" value={agg.fn} onChange={e => setAggregations(a => a.map(x => x.id === agg.id ? { ...x, fn: e.target.value } : x))}>
                            {AGG_FNS.map(fn => <option key={fn.value} value={fn.value}>{fn.label}</option>)}
                          </select>
                          <button className="p-1 text-ink-3 hover:text-danger bg-transparent border-0 cursor-pointer" onClick={() => setAggregations(a => a.filter(x => x.id !== agg.id))}>
                            <X size={13} />
                          </button>
                        </div>
                        {agg.fn !== 'count' && (
                          <select className="px-2 py-[6px] border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent cursor-pointer w-full" value={agg.field} onChange={e => setAggregations(a => a.map(x => x.id === agg.id ? { ...x, field: e.target.value } : x))}>
                            {schema.filter(f => f.aggregatable).map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                        )}
                        <input
                          className="px-2 py-[6px] border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent w-full"
                          placeholder="Nome da coluna no resultado"
                          value={agg.alias}
                          onChange={e => setAggregations(a => a.map(x => x.id === agg.id ? { ...x, alias: e.target.value } : x))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            disabled={!canRun || isPending}
            onClick={handleRun}
            className="gap-2 px-5 py-2.5 text-[13px] font-semibold shadow-sm"
          >
            <Play size={13} fill="currentColor" /> {isPending ? 'Executando…' : 'Executar consulta'}
          </Button>
        </div>
        )}


        {/* ── Results panel ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {results !== null ? (
            <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line">
                <span className="text-[13px] font-medium text-ink">
                  {results.length} resultado{results.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-ink-3">Por página:</span>
                    <select
                      className="px-2 py-1 border border-line rounded-md bg-bg text-[12px] text-ink outline-none focus:border-accent cursor-pointer"
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    >
                      {[25, 50, 100, 250].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <Button variant="secondary" disabled={exporting || results.length === 0} onClick={handleExport}>
                    <Download size={13} /> {exporting ? 'Exportando…' : 'Exportar Excel'}
                  </Button>
                </div>
              </div>
              {results.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-ink-3">Nenhum resultado encontrado.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr>
                          {resultKeys.map(key => (
                            <th key={key} className={thCls}>{getLabel(key)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr key={i} className="hover:bg-bg-hover">
                            {resultKeys.map(key => (
                              <td key={key} className="px-3.5 py-2.5 border-b border-line">
                                {formatCell(row[key], key, mergedSchema, mode === 'sql')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(page > 1 || hasNextPage) && mode !== 'sql' && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-line">
                      <span className="text-[12px] text-ink-3">
                        Página {page} · {results.length} registro{results.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          className="px-2.5 py-1 rounded border border-line bg-bg text-[12px] text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-hover cursor-pointer"
                          disabled={page === 1}
                          onClick={() => handleGoToPage(1)}
                        >
                          «
                        </button>
                        <button
                          className="px-2.5 py-1 rounded border border-line bg-bg text-[12px] text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-hover cursor-pointer"
                          disabled={page === 1}
                          onClick={() => handleGoToPage(page - 1)}
                        >
                          ‹
                        </button>
                        <span className="px-2.5 py-1 rounded border border-accent bg-accent text-white text-[12px]">
                          {page}
                        </span>
                        <button
                          className="px-2.5 py-1 rounded border border-line bg-bg text-[12px] text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-hover cursor-pointer"
                          disabled={!hasNextPage}
                          onClick={() => handleGoToPage(page + 1)}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-bg-elev border border-line rounded-lg flex flex-col items-center justify-center py-24 gap-3 text-ink-3">
              {mode === 'sql' ? <Code size={36} className="opacity-20" /> : <BarChart2 size={36} className="opacity-20" />}
              <p className="text-[13px] m-0">
                {mode === 'sql' ? 'Escreva uma consulta SELECT e clique em' : 'Configure a consulta e clique em'} <strong>Executar</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
