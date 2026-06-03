import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';
import { Plane, ArrowDownLeft, ArrowUpRight, GraduationCap, Users, Clock, Hourglass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getDashboard } from '../api/dashboard';
import { getReceivables } from '../api/receivables';
import { getPayables } from '../api/payables';
import { getFlights } from '../api/flights';
import { getPeoples } from '../api/peoples';
import { formatBRL } from '../utils/format';
import type { Receivable, Payable, Flight } from '../types';

type PeriodMode = 3 | 6 | 12 | 'custom';

const PIE_COLORS = ['var(--accent)','var(--success)','var(--warn)','var(--danger)','var(--accent)','var(--success)','var(--warn)','var(--danger)'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatFullDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const PT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function getMonthRange(n: number): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    result.push(d.toISOString().slice(0, 7));
  }
  return result;
}

function getMonthsBetween(ym1: string, ym2: string): string[] {
  const result: string[] = [];
  const cur = new Date(ym1 + '-01');
  const end = new Date(ym2 + '-01');
  while (cur <= end) {
    result.push(cur.toISOString().slice(0, 7));
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

function buildGrowthData(customers: import('../types').Person[], months: string[]) {
  return months.map(m => {
    const alunos = customers.filter(c => c.categories.includes('student') && c.created_at.slice(0, 7) <= m).length;
    const socios = customers.filter(c => c.categories.includes('partner') && c.created_at.slice(0, 7) <= m).length;
    return {
      month: PT_MONTHS[parseInt(m.split('-')[1]) - 1],
      Alunos: alunos,
      Sócios: socios,
    };
  });
}

function buildGroupPieData(
  items: any[],
  getLabel: (item: any) => string | null,
  getValue: (item: any) => number,
) {
  const map = new Map<string, number>();
  items.forEach(item => {
    const label = getLabel(item);
    if (label == null) return;
    map.set(label, (map.get(label) ?? 0) + getValue(item));
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

function buildFlightsChartData(flights: Flight[], months: string[]) {
  const countMap = new Map(months.map(m => [m, 0]));
  const hoursMap = new Map(months.map(m => [m, 0]));
  flights.forEach(f => {
    const m = f.start_date.slice(0, 7);
    if (countMap.has(m)) {
      countMap.set(m, countMap.get(m)! + 1);
      hoursMap.set(m, hoursMap.get(m)! + Number(f.total_hours ?? 0));
    }
  });
  return months.map(m => ({
    month: PT_MONTHS[parseInt(m.split('-')[1]) - 1],
    Voos:  countMap.get(m) ?? 0,
    Horas: Math.round((hoursMap.get(m) ?? 0) * 10) / 10,
  }));
}

function buildChartData(receivables: Receivable[], payables: Payable[], months: string[]) {
  const recMap      = new Map(months.map(m => [m, 0]));
  const recvdMap    = new Map(months.map(m => [m, 0]));
  const payMap      = new Map(months.map(m => [m, 0]));
  const paidMap     = new Map(months.map(m => [m, 0]));
  receivables.forEach(r => {
    const m = r.created_at.slice(0, 7);
    if (recMap.has(m)) {
      recMap.set(m, recMap.get(m)! + Number(r.total_amount));
      recvdMap.set(m, recvdMap.get(m)! + Number(r.amount_received));
    }
  });
  payables.forEach(p => {
    const m = p.created_at.slice(0, 7);
    if (payMap.has(m)) {
      payMap.set(m, payMap.get(m)! + Number(p.amount));
      paidMap.set(m, paidMap.get(m)! + Number(p.amount_paid));
    }
  });
  return months.map(m => {
    const rec   = recMap.get(m) ?? 0;
    const recvd = recvdMap.get(m) ?? 0;
    const pay   = payMap.get(m) ?? 0;
    const paid  = paidMap.get(m) ?? 0;
    return {
      month:       PT_MONTHS[parseInt(m.split('-')[1]) - 1],
      'A receber': rec,
      'Recebido':  recvd,
      'A pagar':   pay,
      'Pago':      paid,
    };
  });
}

function fmtAxis(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v}`;
}

function GrowthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elev border border-line rounded-lg px-3 py-2 text-[12px] shadow-lg min-w-[140px]">
      <p className="font-semibold mb-1.5 text-ink">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span style={{ color: p.stroke }}>{p.name}</span>
          <span className="font-mono font-medium text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function makePieTooltip(fmt: (v: number) => string) {
  return function PieTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    return (
      <div className="bg-bg-elev border border-line rounded-lg px-3 py-2 text-[12px] shadow-lg">
        <p className="font-medium text-ink mb-0.5">{name}</p>
        <p className="font-mono text-ink">{fmt(value)}</p>
      </div>
    );
  };
}

const moneyFmt  = (v: number) => `R$ ${formatBRL(v)}`;
const countFmt  = (v: number) => `${v} voo${v !== 1 ? 's' : ''}`;
const hoursFmt  = (v: number) => `${v.toFixed(1)}h`;

function PieChartCard({ title, data, loading, empty, valueFormatter = moneyFmt, overflow }: {
  title: string;
  data: { name: string; value: number }[];
  loading: boolean;
  empty: boolean;
  valueFormatter?: (v: number) => string;
  overflow?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const tooltip = makePieTooltip(valueFormatter);
  return (
    <div className="bg-bg-elev border border-line rounded-lg p-5">
      <div className="mb-3">
        <h2 className="text-[13px] font-semibold text-ink m-0">{title}</h2>
      </div>
      {loading ? (
        <div className="h-[160px] skeleton" />
      ) : empty || data.length === 0 ? (
        <div className="h-[160px] flex items-center justify-center text-[13px] text-ink-3">
          Sem dados no período.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={72}
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={tooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-3">
            {data.slice(0, 7).map((d, i) => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={d.name} className="flex items-center gap-2 text-[11.5px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-ink-2 truncate flex-1">{d.name}</span>
                  <span className="text-ink-3 font-mono">{pct}%</span>
                  <span className="text-ink font-mono font-medium">{valueFormatter(d.value)}</span>
                </div>
              );
            })}
            {data.length > 7 && (
              <p className="text-[11px] text-ink-4 m-0 mt-0.5">+{data.length - 7} {overflow ?? 'itens'}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FlightsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const voos  = payload.find((p: any) => p.dataKey === 'Voos');
  const horas = payload.find((p: any) => p.dataKey === 'Horas');
  return (
    <div className="bg-bg-elev border border-line rounded-lg px-3 py-2 text-[12px] shadow-lg min-w-[140px]">
      <p className="font-semibold mb-1.5 text-ink">{label}</p>
      {voos  && <div className="flex justify-between gap-6"><span style={{ color: voos.fill  }}>Voos</span> <span className="font-mono font-medium text-ink">{voos.value}</span></div>}
      {horas && <div className="flex justify-between gap-6"><span style={{ color: horas.fill }}>Horas</span><span className="font-mono font-medium text-ink">{horas.value}h</span></div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elev border border-line rounded-lg px-3 py-2 text-[12px] shadow-lg min-w-[160px]">
      <p className="font-semibold mb-1.5 text-ink">{label}</p>
      {payload.map((p: any) => {
        const color = p.stroke ?? p.fill;
        const val   = Number(p.value);
        return (
          <div key={p.name} className="flex justify-between gap-6">
            <span style={{ color }}>{p.name}</span>
            <span className="font-mono font-medium text-ink">
              {p.name === 'Resultado' && val > 0 ? '+' : ''}R$ {formatBRL(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: 'default' | 'success' | 'danger' | 'accent' | 'warning';
  loading?: boolean;
}

const COLOR: Record<Exclude<KpiProps['color'], undefined>, { icon: string; value: string }> = {
  default: { icon: 'bg-bg-sunk text-ink-3',        value: 'text-ink'     },
  success: { icon: 'bg-success-soft text-success', value: 'text-success' },
  danger:  { icon: 'bg-danger-soft text-danger',   value: 'text-danger'  },
  accent:  { icon: 'bg-accent-soft text-accent-ink', value: 'text-ink'   },
  warning: { icon: 'bg-warn-soft text-warn',        value: 'text-warn'   },
};

function KpiCard({ label, value, sub, icon, color, loading }: KpiProps) {
  const c = COLOR[color];
  if (loading) {
    return (
      <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-[8px] skeleton shrink-0" />
        <div className="flex flex-col gap-1.5 min-w-0 w-full mt-0.5">
          <div className="h-3 skeleton w-2/3" />
          <div className="h-6 skeleton w-4/5" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-[8px] grid place-items-center shrink-0 ${c.icon}`}>{icon}</div>
      <div className="flex flex-col gap-0.5 min-w-0 w-full">
        <div className="text-[12px] text-ink-3 font-medium">{label}</div>
        <div className={`text-[20px] font-bold tracking-tight leading-none font-mono ${c.value}`}>{value}</div>
        {sub && <div className="text-[11px] text-ink-4 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const DATE_INPUT = 'px-2.5 py-1.5 rounded border border-line bg-bg text-[12px] text-ink outline-none focus:border-accent cursor-pointer';

const PRESET_PERIODS: { label: string; value: PeriodMode }[] = [
  { label: '3M',  value: 3  },
  { label: '6M',  value: 6  },
  { label: '12M', value: 12 },
  { label: 'Personalizado', value: 'custom' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const firstName = user?.name?.split(' ')[0] ?? '';

  const [period, setPeriod]       = useState<PeriodMode>(6);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const { months, dateFrom, dateTo } = useMemo(() => {
    if (period === 'custom') {
      if (!customFrom || !customTo || customFrom > customTo) {
        return { months: [] as string[], dateFrom: '', dateTo: '' };
      }
      return {
        months:   getMonthsBetween(customFrom.slice(0, 7), customTo.slice(0, 7)),
        dateFrom: customFrom,
        dateTo:   customTo,
      };
    }
    const m = getMonthRange(period);
    return { months: m, dateFrom: m[0] + '-01', dateTo: todayStr };
  }, [period, customFrom, customTo, todayStr]);

  const ready = Boolean(dateFrom && dateTo);

  const gridColor  = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const tickColor  = theme === 'dark' ? '#888' : '#777';
  const cursorFill = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  const { data: summary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  });

  const { data: recData, isLoading: loadingRec } = useQuery({
    queryKey: ['dash-receivables', dateFrom, dateTo],
    queryFn: () => getReceivables(undefined, undefined, dateFrom, dateTo, 1, 500),
    enabled: ready,
  });

  const { data: payData, isLoading: loadingPay } = useQuery({
    queryKey: ['dash-payables', dateFrom, dateTo],
    queryFn: () => getPayables(undefined, 1, 500, undefined, undefined, dateFrom, dateTo),
    enabled: ready,
  });

  const { data: flightsData, isLoading: loadingFlights } = useQuery({
    queryKey: ['dash-flights', dateFrom, dateTo],
    queryFn: () => getFlights(1, 500, undefined, undefined, undefined, dateFrom, dateTo),
    enabled: ready,
  });

  const { data: customersData } = useQuery({
    queryKey: ['dash-customers-all'],
    queryFn: () => getPeoples(undefined, undefined, 1, 2000),
  });

  const receivables   = recData?.data ?? [];
  const payables      = payData?.data ?? [];
  const flights       = flightsData?.data ?? [];
  const allCustomers  = customersData?.data ?? [];
  const loadingKpi    = (ready && (loadingRec || loadingPay)) || !ready;

  const periodRec     = receivables.reduce((s, r) => s + Number(r.total_amount), 0);
  const periodRecvd   = receivables.reduce((s, r) => s + Number(r.amount_received), 0);
  const periodRecOpen = receivables
    .filter(r => r.status !== 1)
    .reduce((s, r) => s + Math.max(0, Number(r.total_amount) - Number(r.amount_received)), 0);
  const periodPay     = payables.reduce((s, p) => s + Number(p.amount), 0);
  const periodPaid    = payables.reduce((s, p) => s + Number(p.amount_paid), 0);
  const periodPayOpen = payables
    .filter(p => p.status !== 'closed')
    .reduce((s, p) => s + Math.max(0, Number(p.amount) - Number(p.amount_paid)), 0);
  const alunosCount = allCustomers.filter(c => c.categories.includes('student')).length;
  const sociosCount = allCustomers.filter(c => c.categories.includes('partner')).length;
  const totalFlightHours = flights.reduce((s, f) => s + Number(f.total_hours ?? 0), 0);

  const chartData = useMemo(
    () => buildChartData(receivables, payables, months),
    [receivables, payables, months],
  );

  const flightsChartData = useMemo(
    () => buildFlightsChartData(flights, months),
    [flights, months],
  );

  const growthData = useMemo(
    () => buildGrowthData(allCustomers, months),
    [allCustomers, months],
  );

  const recProductPieData = useMemo(
    () => buildGroupPieData(receivables, r => r.product?.trim() || 'Outros', r => Number(r.total_amount)),
    [receivables],
  );
  const payProductPieData = useMemo(
    () => buildGroupPieData(payables, p => p.product?.trim() || 'Outros', p => Number(p.amount)),
    [payables],
  );
  const flightTypeCountData = useMemo(
    () => buildGroupPieData(flights, f => f.type?.trim() || 'Outros', () => 1),
    [flights],
  );
  const flightTypeHoursData = useMemo(
    () => buildGroupPieData(flights, f => f.type?.trim() || 'Outros', f => Math.round(Number(f.total_hours ?? 0) * 10) / 10),
    [flights],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header + filter */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{greeting()}, {firstName}.</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0 capitalize">{formatFullDate()}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 bg-bg-elev border border-line rounded-lg p-1">
            {PRESET_PERIODS.map(p => (
              <button
                key={String(p.value)}
                onClick={() => setPeriod(p.value)}
                className={[
                  'px-3 py-1 rounded text-[12px] font-medium border-0 cursor-pointer transition-colors whitespace-nowrap',
                  period === p.value
                    ? 'bg-accent text-white'
                    : 'bg-transparent text-ink-3 hover:bg-bg-hover hover:text-ink',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                max={customTo || todayStr}
                onChange={e => setCustomFrom(e.target.value)}
                className={DATE_INPUT}
              />
              <span className="text-[12px] text-ink-3">—</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={todayStr}
                onChange={e => setCustomTo(e.target.value)}
                className={DATE_INPUT}
              />
            </div>
          )}
        </div>
      </div>

      {/* Linha 1: KPIs financeiros */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total recebido"
          value={`R$ ${formatBRL(periodRecvd)}`}
          icon={<ArrowDownLeft size={18} />}
          color="success"
          loading={loadingKpi}
        />
        <KpiCard
          label="Total a receber"
          value={`R$ ${formatBRL(periodRecOpen)}`}
          icon={<Clock size={18} />}
          color="warning"
          loading={loadingKpi}
        />
        <KpiCard
          label="Total pago"
          value={`R$ ${formatBRL(periodPaid)}`}
          icon={<ArrowUpRight size={18} />}
          color="danger"
          loading={loadingKpi}
        />
        <KpiCard
          label="Total a pagar"
          value={`R$ ${formatBRL(periodPayOpen)}`}
          icon={<Hourglass size={18} />}
          color="warning"
          loading={loadingKpi}
        />
      </div>

      {/* Linha 2: KPIs operacionais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Quantidade de voos"
          value={loadingKpi ? '—' : String(flights.length)}
          icon={<Plane size={18} />}
          color={summary?.flights.in_flight ? 'accent' : 'default'}
          loading={loadingKpi}
        />
        <KpiCard
          label="Total de horas de voos"
          value={loadingKpi ? '—' : `${totalFlightHours.toFixed(1)}h`}
          icon={<Clock size={18} />}
          color="default"
          loading={loadingKpi}
        />
        <KpiCard
          label="Quantidade de alunos"
          value={String(alunosCount)}
          icon={<GraduationCap size={18} />}
          color="accent"
        />
        <KpiCard
          label="Quantidade de sócios"
          value={String(sociosCount)}
          icon={<Users size={18} />}
          color="success"
        />
      </div>

      {/* Financial chart — full width */}
      <div className="bg-bg-elev border border-line rounded-lg p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="text-[13px] font-semibold text-ink m-0">Resultado financeiro por mês</h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-[2px] inline-block" style={{ background: 'var(--success)' }} />
              Recebido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-[2px] inline-block border-t-2 border-dashed" style={{ borderColor: 'var(--warn)' }} />
              A receber
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-[2px] inline-block" style={{ background: 'var(--danger)' }} />
              Pago
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-[2px] inline-block border-t-2 border-dashed" style={{ borderColor: 'var(--warn)' }} />
              A pagar
            </span>
          </div>
        </div>

        {period === 'custom' && !ready ? (
          <div className="h-[260px] flex items-center justify-center text-[13px] text-ink-3">
            Selecione o intervalo de datas para visualizar o gráfico.
          </div>
        ) : ready && (loadingRec || loadingPay) ? (
          <div className="h-[260px] skeleton" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtAxis}
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                width={58}
              />
<Tooltip content={<ChartTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1 }} />
              <Line dataKey="Recebido"  stroke="var(--success)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--success)' }} type="monotone" />
              <Line dataKey="A receber" stroke="var(--warn)"    strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--warn)'    }} type="monotone" strokeDasharray="5 3" />
              <Line dataKey="Pago"      stroke="var(--danger)"  strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--danger)'  }} type="monotone" />
              <Line dataKey="A pagar"   stroke="var(--warn)"    strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--warn)'    }} type="monotone" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie charts — por tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard
          title="A receber por tipo"
          data={recProductPieData}
          loading={loadingKpi}
          empty={period === 'custom' && !ready}
          overflow="tipos"
        />
        <PieChartCard
          title="A pagar por tipo"
          data={payProductPieData}
          loading={loadingKpi}
          empty={period === 'custom' && !ready}
          overflow="tipos"
        />
      </div>

      {/* Flights chart */}
      <div className="bg-bg-elev border border-line rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[13px] font-semibold text-ink m-0">Voos por mês</h2>
          </div>
          <div className="flex items-center gap-4 text-[11.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded-sm inline-block" style={{ background: 'var(--accent)' }} />
              Voos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded-sm inline-block" style={{ background: 'var(--success)' }} />
              Horas
            </span>
          </div>
        </div>

        {period === 'custom' && !ready ? (
          <div className="h-[240px] flex items-center justify-center text-[13px] text-ink-3">
            Selecione o intervalo de datas para visualizar o gráfico.
          </div>
        ) : ready && loadingFlights ? (
          <div className="h-[240px] skeleton" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={flightsChartData} barGap={4} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <YAxis
                yAxisId="hours"
                orientation="right"
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}h`}
                width={36}
              />
              <Tooltip content={<FlightsTooltip />} cursor={{ fill: cursorFill }} />
              <Bar yAxisId="count" dataKey="Voos"  fill="var(--accent)"  radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar yAxisId="hours" dataKey="Horas" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Flight type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard
          title="Distribuição de voos por tipo"
          data={flightTypeCountData}
          loading={loadingKpi}
          empty={period === 'custom' && !ready}
          valueFormatter={countFmt}
          overflow="tipos"
        />
        <PieChartCard
          title="Horas voadas por tipo"
          data={flightTypeHoursData}
          loading={loadingKpi}
          empty={period === 'custom' && !ready}
          valueFormatter={hoursFmt}
          overflow="tipos"
        />
      </div>

      {/* Growth chart */}
      <div className="bg-bg-elev border border-line rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[13px] font-semibold text-ink m-0">Crescimento de alunos e sócios</h2>
          </div>
          <div className="flex items-center gap-4 text-[11.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded-sm inline-block" style={{ background: 'var(--accent)' }} />
              Alunos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded-sm inline-block" style={{ background: 'var(--success)' }} />
              Sócios
            </span>
          </div>
        </div>

        {period === 'custom' && !ready ? (
          <div className="h-[220px] flex items-center justify-center text-[13px] text-ink-3">
            Selecione o intervalo de datas para visualizar o gráfico.
          </div>
        ) : !customersData ? (
          <div className="h-[220px] skeleton" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="gradAlunos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  style={{ stopColor: 'var(--accent)',  stopOpacity: 0.2 }} />
                  <stop offset="95%" style={{ stopColor: 'var(--accent)',  stopOpacity: 0   }} />
                </linearGradient>
                <linearGradient id="gradSocios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  style={{ stopColor: 'var(--success)', stopOpacity: 0.2 }} />
                  <stop offset="95%" style={{ stopColor: 'var(--success)', stopOpacity: 0   }} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip content={<GrowthTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1 }} />
              <Area type="monotone" dataKey="Alunos" stroke="var(--accent)"  strokeWidth={2} fill="url(#gradAlunos)" dot={false} activeDot={{ r: 4, fill: 'var(--accent)'  }} />
              <Area type="monotone" dataKey="Sócios" stroke="var(--success)" strokeWidth={2} fill="url(#gradSocios)" dot={false} activeDot={{ r: 4, fill: 'var(--success)' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>


    </div>
  );
}
