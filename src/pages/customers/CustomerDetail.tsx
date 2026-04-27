import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Check, X } from 'lucide-react';
import { getCustomer, getCustomerCredits, addCredit } from '../../api/customers';
import { formatBRL, formatDate, formatDateTime, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const customerId = Number(id);

  const { data: customer, isLoading } = useQuery({ queryKey: ['customer', customerId], queryFn: () => getCustomer(customerId) });
  const { data: credits } = useQuery({ queryKey: ['credits', customerId], queryFn: () => getCustomerCredits(customerId) });

  const [tab, setTab] = useState<'titulos' | 'creditos' | 'voos'>('titulos');
  const [creditModal, setCreditModal] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: '', notes: '' });

  const addCreditMut = useMutation({
    mutationFn: (data: { amount: number; notes?: string }) => addCredit(customerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits', customerId] });
      qc.invalidateQueries({ queryKey: ['customer', customerId] });
      setCreditModal(false);
      setCreditForm({ amount: '', notes: '' });
    },
  });

  if (isLoading) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Carregando…</div>;
  if (!customer) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Cliente não encontrado.</div>;

  const receivables = customer.receivables ?? [];
  const flights = customer.flights ?? [];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <button className="btn" style={{ marginBottom: 8 }} onClick={() => navigate('/customers')}>
            <ChevronLeft size={14} /> Clientes
          </button>
          <h1 className="page-title">{customer.name}</h1>
          <p className="page-sub mono" style={{ fontSize: 12 }}>
            {customer.cpf} · {customer.email}
            {customer.categories.map(cat => (
              <span key={cat} className={`chip ${cat}`} style={{ marginLeft: 8 }}>{cat === 'socio' ? 'sócio' : cat}</span>
            ))}
          </p>
        </div>
      </div>

      <div className="tabs">
        {(['titulos', 'creditos', 'voos'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'titulos' ? 'Títulos' : t === 'creditos' ? 'Créditos' : 'Voos'}
          </button>
        ))}
      </div>

      {tab === 'titulos' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Título</th><th>Venc.</th><th className="num">Valor</th><th className="num">Recebido</th><th>Status</th></tr>
              </thead>
              <tbody>
                {receivables.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>Nenhum título encontrado.</td></tr>
                )}
                {receivables.map(r => {
                  const st = receivableStatus(r);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="cell-primary">{r.title}</div>
                        {r.product && <div className="cell-sub">{r.product}</div>}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{formatDate(r.expiration_date)}</td>
                      <td className="num mono">R$ {formatBRL(r.total_amount)}</td>
                      <td className="num mono">{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                      <td><span className={`badge ${STATUS_BADGE[st]}`}><span className="dot" />{STATUS_LABEL[st]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'creditos' && (
        <div className="stack">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="section-label" style={{ marginBottom: 4 }}>Saldo de créditos</div>
              <div className="kpi-value mono">R$ {formatBRL(credits?.flight_hour_balance ?? 0)}</div>
            </div>
            <button className="btn primary" onClick={() => setCreditModal(true)}><Plus size={14} /> Adicionar crédito</button>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>Data</th><th>Forma</th><th className="num">Valor</th><th>Observações</th></tr>
                </thead>
                <tbody>
                  {(credits?.movements ?? []).length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>Sem movimentações.</td></tr>
                  )}
                  {(credits?.movements ?? []).map(m => (
                    <tr key={m.id}>
                      <td className="mono" style={{ fontSize: 12 }}>{formatDateTime(m.payment_date)}</td>
                      <td>{m.payment_method ?? '—'}</td>
                      <td className="num mono">R$ {formatBRL(m.amount_received)}</td>
                      <td style={{ color: 'var(--ink-3)' }}>{m.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'voos' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Tipo</th><th>Rota</th><th>Início</th><th className="num">Horas</th><th className="num">Valor</th><th>Status</th></tr>
              </thead>
              <tbody>
                {flights.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>Nenhum voo encontrado.</td></tr>
                )}
                {flights.map(f => (
                  <tr key={f.id}>
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
      )}

      {creditModal && (
        <div className="modal-backdrop" onClick={() => setCreditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">Adicionar crédito</h3>
              <button className="icon-btn" onClick={() => setCreditModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body stack">
              <div className="field">
                <label>Valor (R$)</label>
                <div className="input-group">
                  <span className="prefix">R$</span>
                  <input className="input mono" type="number" step="0.01" min="0.01" value={creditForm.amount} onChange={e => setCreditForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Observações</label>
                <textarea className="textarea" value={creditForm.notes} onChange={e => setCreditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setCreditModal(false)}>Cancelar</button>
              <button className="btn primary" onClick={() => addCreditMut.mutate({ amount: parseFloat(creditForm.amount), notes: creditForm.notes || undefined })}>
                <Check size={14} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
