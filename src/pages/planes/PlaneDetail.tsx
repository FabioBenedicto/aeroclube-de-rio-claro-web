import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { getPlane } from '../../api/planes';
import { formatBRL, formatDate, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';

export default function PlaneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plane, isLoading } = useQuery({ queryKey: ['plane', Number(id)], queryFn: () => getPlane(Number(id)) });

  if (isLoading) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Carregando…</div>;
  if (!plane) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Aeronave não encontrada.</div>;

  const flights = plane.flights ?? [];
  const closedFlights = flights.filter(f => f.status === 'closed');
  const totalHours = closedFlights.reduce((s, f) => s + (Number(f.total_hours) || 0), 0);
  const totalRevenue = closedFlights.reduce((s, f) => s + (Number(f.total_amount) || 0), 0);
  const lastFlight = closedFlights[0];

  const statusLabel: Record<string, string> = { active: 'Disponível', 'in-flight': 'Em voo', maintenance: 'Manutenção' };
  const statusBadge: Record<string, string> = { active: 'success', 'in-flight': 'accent', maintenance: 'warn' };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <button className="btn" style={{ marginBottom: 8 }} onClick={() => navigate('/planes')}><ChevronLeft size={14} /> Aeronaves</button>
          <h1 className="page-title mono">{plane.registration}</h1>
          <p className="page-sub">{plane.model ?? 'Modelo não informado'} · R$ {formatBRL(plane.flight_hour_value)}/h
            <span className={`badge ${statusBadge[plane.status] ?? 'default'}`} style={{ marginLeft: 10 }}>
              <span className="dot" />{statusLabel[plane.status] ?? plane.status}
            </span>
          </p>
        </div>
      </div>

      <div className="g4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="kpi"><div className="kpi-label">Voos registrados</div><div className="kpi-value">{flights.length}</div></div>
        <div className="kpi"><div className="kpi-label">Horas totais</div><div className="kpi-value mono">{totalHours.toFixed(1)}h</div></div>
        <div className="kpi"><div className="kpi-label">Receita gerada</div><div className="kpi-value mono"><span className="kpi-value" style={{ fontSize: 16 }}>R$</span>{formatBRL(totalRevenue)}</div></div>
        <div className="kpi"><div className="kpi-label">Último voo</div><div className="kpi-value" style={{ fontSize: 16 }}>{lastFlight ? formatDate(lastFlight.start_date) : '—'}</div></div>
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Histórico de voos</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Cliente</th><th>Tipo</th><th>Rota</th><th>Data</th><th className="num">Horas</th><th className="num">Valor</th><th>Status</th></tr>
              </thead>
              <tbody>
                {flights.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>Nenhum voo registrado.</td></tr>
                )}
                {flights.map(f => (
                  <tr key={f.id}>
                    <td className="cell-primary">{f.customer?.name ?? `#${f.customer_id}`}</td>
                    <td>{f.type}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{f.origin} → {f.destination}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{formatDate(f.start_date)}</td>
                    <td className="num mono">{f.total_hours != null ? `${f.total_hours}h` : '—'}</td>
                    <td className="num mono">{f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[f.status]}`}><span className="dot" />{STATUS_LABEL[f.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
