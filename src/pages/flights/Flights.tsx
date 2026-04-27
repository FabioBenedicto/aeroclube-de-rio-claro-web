import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Trash2, Check as CheckIcon } from 'lucide-react';
import { getFlights, createFlight, closeFlight, cancelFlight, deleteFlight } from '../../api/flights';
import { getCustomers } from '../../api/customers';
import { getPlanes } from '../../api/planes';
import { formatDate, formatBRL, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import type { Flight, Customer, Plane } from '../../types';
import FlightModal from './FlightModal';
import CloseFlightModal from './CloseFlightModal';

const STATUS_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'in-flight', label: 'Registrado' },
  { key: 'closed', label: 'Encerrado' },
  { key: 'cancelled', label: 'Cancelado' },
];

export default function Flights() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const [menuId, setMenuId] = useState<number | null>(null);
  const [registerModal, setRegisterModal] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [closingFlight, setClosingFlight] = useState<Flight | null>(null);

  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['flights', tab],
    queryFn: () => getFlights(tab === 'all' ? undefined : tab),
  });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ['customers'], queryFn: getCustomers });
  const { data: planes = [] } = useQuery<Plane[]>({ queryKey: ['planes'], queryFn: getPlanes });

  const deleteMut = useMutation({ mutationFn: deleteFlight, onSuccess: () => qc.invalidateQueries({ queryKey: ['flights'] }) });
  const cancelMut = useMutation({ mutationFn: cancelFlight, onSuccess: () => qc.invalidateQueries({ queryKey: ['flights'] }) });

  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuId]);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="page-title">Voos</h1>
          <p className="page-sub">Registro de operações de voo</p>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => setRegisterModal(true)}><Plus size={14} /> Registrar voo</button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="filter-bar">
          <div className="tabs" style={{ margin: 0, border: 0 }}>
            {STATUS_TABS.map(t => (
              <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Carregando…</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>ID</th><th>Aeronave</th><th>Cliente</th><th>Tipo</th><th>Rota</th><th>Início</th><th className="num">Horas</th><th className="num">Valor</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {flights.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Nenhum voo encontrado.</td></tr>
                )}
                {flights.map(f => (
                  <tr key={f.id}>
                    <td className="mono" style={{ fontSize: 11.5 }}>{f.id}</td>
                    <td className="cell-primary">{f.plane?.registration ?? `#${f.plane_id}`}</td>
                    <td>{f.customer?.name ?? `#${f.customer_id}`}</td>
                    <td>{f.type}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{f.origin} → {f.destination}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{formatDate(f.start_date)}</td>
                    <td className="num mono">{f.total_hours != null ? `${f.total_hours}h` : '—'}</td>
                    <td className="num mono">{f.total_amount != null ? `R$ ${formatBRL(f.total_amount)}` : '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[f.status]}`}><span className="dot" />{STATUS_LABEL[f.status]}</span></td>
                    <td style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" onClick={() => setMenuId(menuId === f.id ? null : f.id)}><MoreHorizontal size={15} /></button>
                      {menuId === f.id && (
                        <div className="row-menu" onClick={() => setMenuId(null)}>
                          {f.status === 'in-flight' && (
                            <button onClick={() => setClosingFlight(f)}><CheckIcon size={14} /> Encerrar voo</button>
                          )}
                          <button onClick={() => setEditFlight(f)}><Edit size={14} /> Editar</button>
                          {f.status !== 'cancelled' && f.status !== 'closed' && (
                            <button onClick={() => { if (confirm('Cancelar voo?')) cancelMut.mutate(f.id); }}>Cancelar</button>
                          )}
                          <div className="row-menu-sep" />
                          <button className="danger" onClick={() => { if (confirm('Remover voo?')) deleteMut.mutate(f.id); }}><Trash2 size={14} /> Remover</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {registerModal && (
        <FlightModal
          mode="new"
          customers={customers}
          planes={planes}
          onClose={() => setRegisterModal(false)}
          onSave={(data) => createFlight(data).then(() => { qc.invalidateQueries({ queryKey: ['flights'] }); setRegisterModal(false); })}
        />
      )}
      {editFlight && (
        <FlightModal
          mode="edit"
          flight={editFlight}
          customers={customers}
          planes={planes}
          onClose={() => setEditFlight(null)}
          onSave={() => { qc.invalidateQueries({ queryKey: ['flights'] }); setEditFlight(null); }}
        />
      )}
      {closingFlight && (
        <CloseFlightModal
          flight={closingFlight}
          onClose={() => setClosingFlight(null)}
          onSave={(end_date) => closeFlight(closingFlight.id, end_date).then(() => { qc.invalidateQueries({ queryKey: ['flights'] }); setClosingFlight(null); })}
        />
      )}
    </div>
  );
}
