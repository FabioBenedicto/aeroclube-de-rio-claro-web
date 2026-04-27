import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Eye } from 'lucide-react';
import { getPlanes, createPlane, updatePlane } from '../../api/planes';
import type { Plane } from '../../types';
import PlaneModal from './PlaneModal';

export default function Planes() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: planes = [], isLoading } = useQuery<Plane[]>({ queryKey: ['planes'], queryFn: getPlanes });
  const [menuId, setMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; plane?: Plane } | null>(null);

  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuId]);

  function handleSave(data: unknown, id?: number) {
    const fn = id ? updatePlane(id, data) : createPlane(data);
    fn.then(() => { qc.invalidateQueries({ queryKey: ['planes'] }); setModal(null); });
  }

  const statusLabel: Record<string, string> = { active: 'Disponível', 'in-flight': 'Em voo', maintenance: 'Manutenção' };
  const statusBadge: Record<string, string> = { active: 'success', 'in-flight': 'accent', maintenance: 'warn' };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="page-title">Aeronaves</h1>
          <p className="page-sub">Frota do aeroclube</p>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => setModal({ mode: 'new' })}><Plus size={14} /> Nova aeronave</button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Carregando…</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Matrícula</th><th>Modelo</th><th className="num">Valor/h</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {planes.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/planes/${p.id}`)}>
                    <td className="cell-primary mono">{p.registration}</td>
                    <td>{p.model ?? '—'}</td>
                    <td className="num mono">R$ {Number(p.flight_hour_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td><span className={`badge ${statusBadge[p.status] ?? 'default'}`}><span className="dot" />{statusLabel[p.status] ?? p.status}</span></td>
                    <td style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" onClick={() => setMenuId(menuId === p.id ? null : p.id)}><MoreHorizontal size={15} /></button>
                      {menuId === p.id && (
                        <div className="row-menu" onClick={() => setMenuId(null)}>
                          <button onClick={() => navigate(`/planes/${p.id}`)}><Eye size={14} /> Ver detalhes</button>
                          <button onClick={() => setModal({ mode: 'edit', plane: p })}><Edit size={14} /> Editar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {planes.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Nenhuma aeronave cadastrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <PlaneModal mode={modal.mode} plane={modal.plane} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
