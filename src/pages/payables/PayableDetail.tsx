import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Trash2, Check as CheckIcon, Paperclip, ExternalLink } from 'lucide-react';
import { getPayable, deletePayablePayment, registerPayablePayment, uploadPayablePaymentNotaFiscal, deletePayablePaymentNotaFiscal } from '../../api/payables';
import { formatBRL, formatDate, formatDateTime } from '../../utils/format';
import PayModal from '../../components/PayModal';
import Badge from '../../components/ui/Badge';

type BadgeVariant = 'success' | 'warn' | 'danger' | 'accent' | 'default';

const UPLOADS_BASE = 'http://localhost:3001';

const P_STATUS_LABEL: Record<string, string> = { open: 'A pagar', partial: 'Parcial', closed: 'Pago' };
const P_STATUS_BADGE: Record<string, string> = { open: 'warn', partial: 'accent', closed: 'success' };

const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

function NfCell({ paymentId, payableId, path, onChanged }: {
  paymentId: number; payableId: number; path?: string | null; onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadPayablePaymentNotaFiscal(payableId, paymentId, file),
    onSuccess: onChanged,
  });
  const deleteMut = useMutation({
    mutationFn: () => deletePayablePaymentNotaFiscal(payableId, paymentId),
    onSuccess: onChanged,
  });
  return (
    <td className={`${tdCls} whitespace-nowrap`}>
      {path ? (
        <span className="flex items-center gap-1">
          <a href={`${UPLOADS_BASE}${path}`} target="_blank" rel="noopener noreferrer" className="text-accent flex items-center gap-0.5 text-[12px] hover:underline">
            <Paperclip size={12} /> NF <ExternalLink size={11} />
          </a>
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-danger cursor-pointer hover:bg-bg-hover" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
            <Trash2 size={12} />
          </button>
        </span>
      ) : (
        <button className={iconBtn} title="Anexar NF" onClick={() => fileRef.current?.click()} disabled={uploadMut.isPending}>
          <Paperclip size={13} />
        </button>
      )}
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadMut.mutate(f); e.target.value = ''; }} />
    </td>
  );
}

export default function PayableDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const payableId = Number(id);
  const [showPay, setShowPay] = useState(false);

  const { data: payable, isLoading } = useQuery({
    queryKey: ['payable', payableId],
    queryFn: () => getPayable(payableId),
  });

  const deletePaymentMut = useMutation({
    mutationFn: (paymentId: number) => deletePayablePayment(payableId, paymentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payable', payableId] }),
  });

  const payMut = useMutation({
    mutationFn: (d: unknown) => registerPayablePayment(payableId, d as { amount: number; method?: string; paid_at?: string }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payable', payableId] }); setShowPay(false); },
  });

  if (isLoading) return <div className="p-8 text-[13px] text-ink-3">Carregando…</div>;
  if (!payable) return <div className="p-8 text-[13px] text-ink-3">Título não encontrado.</div>;

  const balance = Number(payable.amount) - Number(payable.amount_paid);
  const pct = Number(payable.amount) > 0
    ? Math.round((Number(payable.amount_paid) / Number(payable.amount)) * 100)
    : 0;
  const badge = P_STATUS_BADGE[payable.status] ?? 'default';
  const label = P_STATUS_LABEL[payable.status] ?? payable.status;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/payables')}>
            <ChevronLeft size={15} /> Voltar
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{payable.id} · {payable.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
            {payable.product && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-bg-sunk border border-line text-ink-2">{payable.product}</span>}
            <span className="text-[13px] text-ink-3 font-mono text-[12px]">Vencimento {payable.due_date ? formatDate(payable.due_date) : '—'}</span>
            <Badge variant={(badge) as BadgeVariant}>{label}</Badge>
          </div>
        </div>
        {payable.status !== 'closed' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={() => setShowPay(true)}><CheckIcon size={14} /> Pagar</button>
          </div>
        )}
      </div>

      {payable.description && (
        <div className="bg-bg-elev border border-line rounded-lg px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1.5">Descrição</div>
          <p className="m-0 text-[13.5px] text-ink-2 leading-relaxed">{payable.description}</p>
        </div>
      )}

      {(payable.customer || payable.company || payable.instructor || payable.plane || payable.partner || payable.employee) && (() => {
        const pt = payable.payer_type;
        const btnCls = 'flex flex-col px-3.5 py-2.5 text-left cursor-pointer bg-bg-elev border border-line rounded-lg hover:bg-bg-hover';
        const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-0.5';
        const valueCls = 'text-[13.5px] font-medium text-ink';

        const payerNode = pt === 'customer' && payable.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${payable.customer!.id}`)}>
            <div className={labelCls}>Pessoa</div><div className={valueCls}>{payable.customer.name}</div>
          </button>
        ) : pt === 'company' && payable.company ? (
          <button className={btnCls} onClick={() => navigate(`/companies/${payable.company!.id}`)}>
            <div className={labelCls}>Empresa</div><div className={valueCls}>{payable.company.name}</div>
          </button>
        ) : pt === 'instructor' && payable.instructor?.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${payable.instructor!.customer_id}`)}>
            <div className={labelCls}>Instrutor</div><div className={valueCls}>{payable.instructor.customer.name}</div>
          </button>
        ) : pt === 'partner' && payable.partner?.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${payable.partner!.customer_id}`)}>
            <div className={labelCls}>Sócio</div><div className={valueCls}>{payable.partner.customer.name}</div>
          </button>
        ) : pt === 'employee' && payable.employee?.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${payable.employee!.customer_id}`)}>
            <div className={labelCls}>Funcionário</div><div className={valueCls}>{payable.employee.customer.name}</div>
          </button>
        ) : null;

        const assocNodes = [
          pt !== 'customer' && payable.customer && (
            <button key="customer" className={btnCls} onClick={() => navigate(`/pessoas/${payable.customer!.id}`)}>
              <div className={labelCls}>Pessoa</div><div className={valueCls}>{payable.customer.name}</div>
            </button>
          ),
          pt !== 'company' && payable.company && (
            <button key="company" className={btnCls} onClick={() => navigate(`/companies/${payable.company!.id}`)}>
              <div className={labelCls}>Empresa</div><div className={valueCls}>{payable.company.name}</div>
            </button>
          ),
          pt !== 'instructor' && payable.instructor?.customer && (
            <button key="instructor" className={btnCls} onClick={() => navigate(`/pessoas/${payable.instructor!.customer_id}`)}>
              <div className={labelCls}>Instrutor</div><div className={valueCls}>{payable.instructor.customer.name}</div>
            </button>
          ),
          pt !== 'partner' && payable.partner?.customer && (
            <button key="partner" className={btnCls} onClick={() => navigate(`/pessoas/${payable.partner!.customer_id}`)}>
              <div className={labelCls}>Sócio</div><div className={valueCls}>{payable.partner.customer.name}</div>
            </button>
          ),
          pt !== 'employee' && payable.employee?.customer && (
            <button key="employee" className={btnCls} onClick={() => navigate(`/pessoas/${payable.employee!.customer_id}`)}>
              <div className={labelCls}>Funcionário</div><div className={valueCls}>{payable.employee.customer.name}</div>
            </button>
          ),
          payable.plane && (
            <button key="plane" className={btnCls} onClick={() => navigate(`/planes/${payable.plane!.id}`)}>
              <div className={labelCls}>Aeronave</div>
              <div className={`${valueCls} font-mono`}>{payable.plane.registration}{payable.plane.model ? ` · ${payable.plane.model}` : ''}</div>
            </button>
          ),
        ].filter(Boolean);

        return (
          <div className="flex flex-col gap-4">
            {payerNode && (
              <div>
                <h2 className="text-[15px] font-semibold mb-3">Pagador</h2>
                <div className="flex flex-wrap gap-2.5">{payerNode}</div>
              </div>
            )}
            {assocNodes.length > 0 && (
              <div>
                <h2 className="text-[15px] font-semibold mb-3">Associações</h2>
                <div className="flex flex-wrap gap-2.5">{assocNodes}</div>
              </div>
            )}
          </div>
        );
      })()}

      <div>
        <h2 className="text-[15px] font-semibold mb-3">Financeiro</h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Valor total</div>
            <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono">
              <span className="text-[14px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(payable.amount)}
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Já pago</div>
            <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono text-success">
              <span className="text-[14px] mr-0.5 font-medium">R$</span>{formatBRL(payable.amount_paid)}
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Saldo devedor</div>
            <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono" style={{ color: balance > 0 ? 'var(--danger)' : undefined }}>
              <span className="text-[14px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(balance)}
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Progresso</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono text-[13px] font-semibold">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-semibold mb-3">Pagamentos realizados</h2>
        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={thCls}>Data</th>
                  <th className={thCls}>Forma de pagamento</th>
                  <th className={thNumCls}>Valor pago</th>
                  <th className={thCls} style={{ width: 60 }}>NF</th>
                  <th className={thCls} style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {(payable.payments ?? []).map(p => (
                  <tr key={p.id} className="hover:bg-bg-hover">
                    <td className={`${tdCls} font-mono text-[12px]`}>{formatDateTime(p.paid_at)}</td>
                    <td className={tdCls}>{p.method ?? '—'}</td>
                    <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount)}</td>
                    <NfCell
                      paymentId={p.id}
                      payableId={payableId}
                      path={p.nota_fiscal_path}
                      onChanged={() => qc.invalidateQueries({ queryKey: ['payable', payableId] })}
                    />
                    <td className={tdCls}>
                      <button
                        className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-danger cursor-pointer hover:bg-bg-hover"
                        onClick={() => deletePaymentMut.mutate(p.id)}
                        disabled={deletePaymentMut.isPending}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(payable.payments ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-8 text-center text-ink-3">Nenhum pagamento registrado.</td>
                  </tr>
                )}
                {(payable.payments ?? []).length > 0 && (
                  <tr className="font-semibold bg-bg-sunk">
                    <td colSpan={2} className="px-3.5 py-2.5 text-right text-[12px] text-ink-3">Total pago</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(payable.amount_paid)}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPay && <PayModal payable={payable} onClose={() => setShowPay(false)} onSave={d => payMut.mutate(d)} />}
    </div>
  );
}
