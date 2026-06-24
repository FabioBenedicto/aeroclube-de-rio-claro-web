import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Paperclip, ExternalLink, Trash2, CreditCard } from 'lucide-react';
import { getBill, payBill, uploadBillNotaFiscal, deleteBillNotaFiscal } from '../../api/invoices';
import { PayInvoiceModal } from './PayInvoiceModal';
import { CnabBaixaModal } from './CnabBaixaModal';
import Badge from '../../components/ui/Badge';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import { toast, extractErrorMessage } from '../../utils/toast';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const billId = Number(id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [payModal, setPayModal] = useState(false);
  const [baixaModal, setBaixaModal] = useState(false);

  const { data: bill, isLoading } = useQuery({ queryKey: ['bill', billId], queryFn: () => getBill(billId) });

  const payMut = useMutation({
    mutationFn: (data: { payment_method: string; payment_date: string; use_credit?: boolean }) => payBill(billId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bill', billId] }); qc.invalidateQueries({ queryKey: ['receivables'] }); setPayModal(false); setBaixaModal(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

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

  if (isLoading) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton.Block className="h-[13px] w-14 mb-1" />
          <Skeleton.Title width="w-24" />
          <Skeleton.Text width="w-56" />
        </div>
      </div>
      <div>
        <Skeleton.Block className="h-[18px] w-36 mb-3 rounded" />
        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <tbody><Skeleton.TableRows cols={4} rows={4} /></tbody>
          </table>
        </div>
      </div>
      <div>
        <Skeleton.Block className="h-[18px] w-28 mb-3 rounded" />
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          <Skeleton.Block className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
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
            {bill.people?.name ?? `#${bill.people_id}`} · Emitida em {formatDate(bill.created_at)}
          </p>
          {bill.status === 'paid' && bill.payment_date && (
            <p className="text-[13px] text-ink-3 mt-0.5 m-0">
              Pago em {formatDate(bill.payment_date)}
              {bill.payment_method ? ` via ${bill.payment_method}` : ''}
            </p>
          )}
        </div>
        {(bill.status === 'open' || bill.status === 'pending_cnab') && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {bill.status === 'open' && (
              <Button variant="primary" onClick={() => setPayModal(true)}>
                <CreditCard size={14} /> Receber
              </Button>
            )}
            {bill.status === 'pending_cnab' && (
              <Button variant="primary" onClick={() => setBaixaModal(true)}>
                <CreditCard size={14} /> Dar baixa
              </Button>
            )}
          </div>
        )}
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
                    <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(item.amount)}</td>
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

      <div>
        <h2 className="text-[15px] font-semibold mb-3">Nota Fiscal</h2>
        <div className="bg-bg-elev border border-line rounded-lg p-4">
          {bill.file ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-accent-soft flex items-center justify-center flex-shrink-0">
                <Paperclip size={15} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink truncate">{bill.file.original_name}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">
                  {bill.file.size
                    ? (bill.file.size >= 1024 * 1024
                        ? `${(bill.file.size / 1024 / 1024).toFixed(1)} MB`
                        : `${(bill.file.size / 1024).toFixed(0)} KB`)
                    : ''}{bill.file.size && bill.file.mime_type ? ' · ' : ''}
                  {bill.file.mime_type?.split('/').pop()?.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="default" onClick={() => window.open(bill.file!.url, '_blank')}>
                  <ExternalLink size={14} /> Visualizar
                </Button>
                <Button variant="danger" onClick={() => deleteNfMut.mutate()} disabled={deleteNfMut.isPending}>
                  <Trash2 size={14} /> Remover
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-bg-sunk flex items-center justify-center">
                <Paperclip size={18} className="text-ink-3" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-ink">Nenhuma nota fiscal anexada</div>
                <div className="text-[12px] text-ink-3 mt-0.5">Anexe um arquivo PDF, JPG ou PNG</div>
              </div>
              <Button variant="default" onClick={() => fileRef.current?.click()} disabled={uploadMut.isPending}>
                <Paperclip size={14} /> {uploadMut.isPending ? 'Enviando…' : 'Anexar NF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {payModal && <PayInvoiceModal billId={billId} totalAmount={bill.total_amount} creditBalance={bill.people?.credit_balance} isPending={payMut.isPending} onClose={() => setPayModal(false)} onSave={data => payMut.mutate(data)} />}
      {baixaModal && <CnabBaixaModal billId={billId} totalAmount={bill.total_amount} isPending={payMut.isPending} onClose={() => setBaixaModal(false)} onSave={data => payMut.mutate(data)} />}
    </div>
  );
}
