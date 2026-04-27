import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { getBill } from '../../api/invoices';
import { formatBRL, formatDate } from '../../utils/format';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bill, isLoading } = useQuery({ queryKey: ['bill', Number(id)], queryFn: () => getBill(Number(id)) });

  if (isLoading) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Carregando…</div>;
  if (!bill) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Fatura não encontrada.</div>;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <button className="btn" style={{ marginBottom: 8 }} onClick={() => navigate('/invoices')}><ChevronLeft size={14} /> Faturas</button>
          <h1 className="page-title">F-{String(bill.id).padStart(4, '0')}</h1>
          <p className="page-sub">{bill.customer?.name} · Emitida em {formatDate(bill.issue_date)}</p>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Títulos vinculados</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Título</th><th>Venc.</th><th className="num">Valor total</th><th className="num">Nesta fatura</th></tr></thead>
              <tbody>
                {(bill.items ?? []).map(item => (
                  <tr key={item.id}>
                    <td className="cell-primary">{item.receivable?.title ?? `#${item.receivable_id}`}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{item.receivable?.expiration_date ? formatDate(item.receivable.expiration_date) : '—'}</td>
                    <td className="num mono">{item.receivable ? `R$ ${formatBRL(item.receivable.total_amount)}` : '—'}</td>
                    <td className="num mono">R$ {formatBRL(item.amount)}</td>
                  </tr>
                ))}
                {(bill.items ?? []).length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>Nenhum título.</td></tr>}
                <tr style={{ fontWeight: 600 }}>
                  <td colSpan={3} style={{ textAlign: 'right', paddingRight: 12 }}>Total</td>
                  <td className="num mono">R$ {formatBRL(bill.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
