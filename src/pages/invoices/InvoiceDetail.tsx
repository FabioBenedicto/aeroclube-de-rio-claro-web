import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Paperclip, ExternalLink, Trash2 } from 'lucide-react';
import { getBill, uploadBillNotaFiscal, deleteBillNotaFiscal } from '../../api/invoices';
import Badge from '../../components/ui/Badge';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import { toast, extractErrorMessage } from '../../utils/toast';

const UPLOADS_BASE = 'http://localhost:3001';

const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnDanger = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-danger bg-danger text-white cursor-pointer hover:opacity-90';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const billId = Number(id);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: bill, isLoading } = useQuery({ queryKey: ['bill', billId], queryFn: () => getBill(billId) });

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadBillNotaFiscal(billId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bill', billId] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const deleteNfMut = useMutation({
    mutationFn: () => deleteBillNotaFiscal(billId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bill', billId] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) return <div className="p-8 text-[13px] text-ink-3">Carregando…</div>;
  if (!bill) return <div className="p-8 text-[13px] text-ink-3">Fatura não encontrada.</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/invoices')}>
            <ChevronLeft size={15} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">#{bill.id}</h1>
            <Badge variant={BILL_STATUS_BADGE[bill.status]}>{BILL_STATUS_LABEL[bill.status]}</Badge>
          </div>
          <p className="text-[13px] text-ink-3 mt-1 m-0">
            {bill.customer?.name} · Emitida em {formatDate(bill.issue_date)}
          </p>
          {bill.status === 'paid' && bill.paid_at && (
            <p className="text-[13px] text-ink-3 mt-0.5 m-0">
              Pago em {formatDate(bill.paid_at)}
              {bill.payment_method ? ` via ${bill.payment_method}` : ''}
              {bill.payment_source ? ` (${bill.payment_source === 'cnab' ? 'CNAB' : 'manual'})` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {bill.nota_fiscal_path ? (
            <>
              <a href={`${UPLOADS_BASE}${bill.nota_fiscal_path}`} target="_blank" rel="noopener noreferrer" className={btnCancel + ' no-underline'}>
                <ExternalLink size={14} /> Ver NF
              </a>
<button className={btnDanger} onClick={() => deleteNfMut.mutate()}>
                <Trash2 size={14} /> Remover NF
              </button>
            </>
          ) : (
            <button className={btnCancel} onClick={() => fileRef.current?.click()}>
              <Paperclip size={14} /> Anexar NF
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) uploadMut.mutate(f);
          e.target.value = '';
        }}
      />

      <div>
        <h2 className="text-[15px] font-semibold mb-3">Títulos vinculados</h2>
        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={thCls}>Título</th>
                  <th className={thCls}>Vencimento</th>
                  <th className={thNumCls}>Valor total</th>
                  <th className={thNumCls}>Nesta fatura</th>
                </tr>
              </thead>
              <tbody>
                {(bill.receivable_payments ?? []).map(item => (
                  <tr key={item.id} className="hover:bg-bg-hover">
                    <td className={`${tdCls} font-medium`}>{item.receivable?.title ?? `${item.receivable_id}`}</td>
                    <td className={`${tdCls} font-mono text-[12px]`}>{item.receivable?.expiration_date ? formatDate(item.receivable.expiration_date) : '—'}</td>
                    <td className={`${tdCls} text-right font-mono`}>{item.receivable ? `R$ ${formatBRL(item.receivable.total_amount)}` : '—'}</td>
                    <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(item.amount_received)}</td>
                  </tr>
                ))}
                {(bill.receivable_payments ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-3.5 py-6 text-center text-ink-3">Nenhum título vinculado.</td></tr>
                )}
                <tr className="font-semibold">
                  <td colSpan={3} className="px-3.5 py-2.5 text-right">Total</td>
                  <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(bill.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
