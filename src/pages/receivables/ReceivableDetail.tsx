import { useState, type ElementType } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Check as CheckIcon, X, Edit, Plane as PlaneIcon, Calendar, Wrench, Package } from 'lucide-react';
import { getReceivable, updateReceivable, deletePayment, registerPayment, uploadPaymentNotaFiscal, deletePaymentNotaFiscal } from '../../api/receivables';
import PaymentRowMenu from '../../components/PaymentRowMenu';
import DateInput from '../../components/DateInput';
import type { Receivable } from '../../types';
import { formatBRL, formatDate, formatDateTime, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import SettleModal from '../../components/SettleModal';
import Badge from '../../components/ui/Badge';
import { toast, extractErrorMessage } from '../../utils/toast';

type BadgeVariant = 'success' | 'warn' | 'danger' | 'accent' | 'default';

const REC_PRODUCT_MAP: Record<string, { label: string; Icon: ElementType }> = {
  voo:         { label: 'Voo',        Icon: PlaneIcon },
  mensalidade: { label: 'Mensalidade',Icon: Calendar  },
  servico:     { label: 'Serviço',    Icon: Wrench    },
  outro:       { label: 'Outro',      Icon: Package   },
};

const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';
const inputCls = 'w-full px-3 py-1.5 text-[13px] bg-bg border border-line rounded-md text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100 placeholder:text-ink-3';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90';

function PayRow({ p, receivableId, onDelete, onNfChanged }: {
  p: { id: number; payment_date: string; payment_method?: string | null; amount_received: number; nota_fiscal_path?: string | null };
  receivableId: number; onDelete: () => void; onNfChanged: () => void;
}) {
  const uploadMut = useMutation({ mutationFn: (f: File) => uploadPaymentNotaFiscal(receivableId, p.id, f), onSuccess: onNfChanged, onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  const deleteNfMut = useMutation({ mutationFn: () => deletePaymentNotaFiscal(receivableId, p.id), onSuccess: onNfChanged, onError: (e: unknown) => toast.error(extractErrorMessage(e)) });
  return (
    <tr className="hover:bg-bg-hover">
      <td className={`${tdCls} font-mono text-[12px]`}>{formatDateTime(p.payment_date)}</td>
      <td className={tdCls}>{p.payment_method ?? '—'}</td>
      <td className={`${tdCls} text-right font-mono`}>R$ {formatBRL(p.amount_received)}</td>
      <td className={`${tdCls} text-right pr-2`} style={{ width: 44 }}>
        <PaymentRowMenu
          nfPath={p.nota_fiscal_path}
          showNf={p.payment_method !== 'Crédito'}
          onAddNf={f => uploadMut.mutate(f)}
          onRemoveNf={() => deleteNfMut.mutate()}
          onDelete={onDelete}
          uploadPending={uploadMut.isPending}
          nfDeletePending={deleteNfMut.isPending}
        />
      </td>
    </tr>
  );
}

function EditReceivableModal({ rec, onClose, onSave }: { rec: Receivable; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ title: rec.title, expiration_date: rec.expiration_date?.slice(0, 10) ?? '', total_amount: String(rec.total_amount) });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">Editar título</h3>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Descrição</label>
            <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
              <DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor</label>
              <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg border-r border-line select-none">R$</span>
                <input type="number" step="0.01" className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <button className={btnCancel} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} onClick={() => onSave({ title: form.title, expiration_date: form.expiration_date || undefined, total_amount: parseFloat(form.total_amount) })}><CheckIcon size={14} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function ReceivableDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const receivableId = Number(id);
  const [showSettle, setShowSettle] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { data: rec, isLoading } = useQuery({
    queryKey: ['receivable', receivableId],
    queryFn: () => getReceivable(receivableId),
  });

  const deletePaymentMut = useMutation({
    mutationFn: (paymentId: number) => deletePayment(receivableId, paymentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivable', receivableId] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const payMut = useMutation({
    mutationFn: (d: unknown) => registerPayment(receivableId, d as { amount_received: number; payment_method?: string; payment_date?: string; use_credit?: boolean }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivable', receivableId] }); setShowSettle(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const editMut = useMutation({
    mutationFn: (d: unknown) => updateReceivable(receivableId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivable', receivableId] }); setShowEdit(false); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  if (isLoading) return <div className="p-8 text-[13px] text-ink-3">Carregando…</div>;
  if (!rec) return <div className="p-8 text-[13px] text-ink-3">Título não encontrado.</div>;

  const st = receivableStatus(rec);
  const pct = Number(rec.total_amount) > 0
    ? Math.round((Number(rec.amount_received) / Number(rec.total_amount)) * 100)
    : 0;
  const balance = Number(rec.total_amount) - Number(rec.amount_received);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink" onClick={() => navigate('/receivables')}>
            <ChevronLeft size={15} /> Voltar
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{rec.id} · {rec.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
            {rec.product && (() => { const p = REC_PRODUCT_MAP[rec.product!]; return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-bg-sunk border border-line text-ink-2">{p && <p.Icon size={11} />}{p?.label ?? rec.product}</span>; })()}
            {rec.expiration_date && <span className="text-[13px] text-ink-3 font-mono text-[12px]">Vencimento {formatDate(rec.expiration_date)}</span>}
            <Badge variant={(STATUS_BADGE[st] ?? 'default') as BadgeVariant}>{STATUS_LABEL[st]}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className={btnCancel} onClick={() => setShowEdit(true)}><Edit size={14} /> Editar</button>
          {st !== 'paid' && (
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={() => setShowSettle(true)}><CheckIcon size={14} /> Receber</button>
          )}
        </div>
      </div>

      {rec.description && (
        <div className="bg-bg-elev border border-line rounded-lg px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1.5">Descrição</div>
          <p className="m-0 text-[13.5px] text-ink-2 leading-relaxed">{rec.description}</p>
        </div>
      )}

      {(() => {
        const pt = rec.payer_type;
        const btnCls = 'flex flex-col px-3.5 py-2.5 text-left cursor-pointer bg-bg-elev border border-line rounded-lg hover:bg-bg-hover';
        const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-0.5';
        const valueCls = 'text-[13.5px] font-medium text-ink';

        const payerNode = pt === 'customer' && rec.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${rec.customer!.id}`)}>
            <div className={labelCls}>Pessoa</div>
            <div className={valueCls}>{rec.customer.name}</div>
          </button>
        ) : pt === 'company' && rec.company ? (
          <button className={btnCls} onClick={() => navigate(`/companies/${rec.company!.id}`)}>
            <div className={labelCls}>Empresa</div>
            <div className={valueCls}>{rec.company.name}</div>
          </button>
        ) : pt === 'instructor' && rec.instructor?.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${rec.instructor!.customer_id}`)}>
            <div className={labelCls}>Instrutor</div>
            <div className={valueCls}>{rec.instructor.customer.name}</div>
          </button>
        ) : pt === 'partner' && rec.partner?.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${rec.partner!.customer_id}`)}>
            <div className={labelCls}>Sócio</div>
            <div className={valueCls}>{rec.partner.customer.name}</div>
          </button>
        ) : pt === 'employee' && rec.employee?.customer ? (
          <button className={btnCls} onClick={() => navigate(`/pessoas/${rec.employee!.customer_id}`)}>
            <div className={labelCls}>Funcionário</div>
            <div className={valueCls}>{rec.employee.customer.name}</div>
          </button>
        ) : null;

        const flightNode = rec.flight ? (
          <button key="flight" className={btnCls} onClick={() => navigate(`/flights?id=${rec.flight!.id}`)}>
            <div className={labelCls}>Voo</div>
            <div className={valueCls}>{rec.flight.id}</div>
          </button>
        ) : null;

        const assocNodes = [
          pt !== 'customer' && rec.customer && (
            <button key="customer" className={btnCls} onClick={() => navigate(`/pessoas/${rec.customer!.id}`)}>
              <div className={labelCls}>Pessoa</div>
              <div className={valueCls}>{rec.customer.name}</div>
            </button>
          ),
          pt !== 'company' && rec.company && (
            <button key="company" className={btnCls} onClick={() => navigate(`/companies/${rec.company!.id}`)}>
              <div className={labelCls}>Empresa</div>
              <div className={valueCls}>{rec.company.name}</div>
            </button>
          ),
          pt !== 'instructor' && rec.instructor?.customer && (
            <button key="instructor" className={btnCls} onClick={() => navigate(`/pessoas/${rec.instructor!.customer_id}`)}>
              <div className={labelCls}>Instrutor</div>
              <div className={valueCls}>{rec.instructor.customer.name}</div>
            </button>
          ),
          pt !== 'partner' && rec.partner?.customer && (
            <button key="partner" className={btnCls} onClick={() => navigate(`/pessoas/${rec.partner!.customer_id}`)}>
              <div className={labelCls}>Sócio</div>
              <div className={valueCls}>{rec.partner.customer.name}</div>
            </button>
          ),
          pt !== 'employee' && rec.employee?.customer && (
            <button key="employee" className={btnCls} onClick={() => navigate(`/pessoas/${rec.employee!.customer_id}`)}>
              <div className={labelCls}>Funcionário</div>
              <div className={valueCls}>{rec.employee.customer.name}</div>
            </button>
          ),
          rec.plane && (
            <button key="plane" className={btnCls} onClick={() => navigate(`/planes/${rec.plane!.id}`)}>
              <div className={labelCls}>Aeronave</div>
              <div className={`${valueCls} font-mono`}>{rec.plane.registration}{rec.plane.model ? ` · ${rec.plane.model}` : ''}</div>
            </button>
          ),
          flightNode,
        ].filter(Boolean);

        if (!payerNode && assocNodes.length === 0) return null;

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
              <span className="text-[14px] text-ink-3 mr-0.5 font-medium">R$</span>{formatBRL(rec.total_amount)}
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Valor recebido</div>
            <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono" style={{ color: 'var(--success)' }}>
              <span className="text-[14px] mr-0.5 font-medium" style={{ color: 'var(--success)' }}>R$</span>{formatBRL(rec.amount_received)}
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Valor a receber</div>
            <div className="text-[22px] font-bold tracking-[-0.02em] mt-1 font-mono" style={{ color: 'var(--warn)' }}>
              <span className="text-[14px] mr-0.5 font-medium" style={{ color: 'var(--warn)' }}>R$</span>{formatBRL(balance)}
            </div>
          </div>
          <div className="bg-bg-elev border border-line rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Progresso</div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--line)', transition: 'width 0.3s' }} />
              </div>
              <span className="font-mono text-[13px] font-semibold" style={{ color: st === 'paid' ? 'var(--success)' : pct > 0 ? 'var(--warn)' : undefined }}>{pct}%</span>
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
                  <th className={thNumCls}>Valor recebido</th>
                  <th className={thCls} style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {(rec.payments ?? []).map(p => (
                  <PayRow
                    key={p.id}
                    p={p}
                    receivableId={receivableId}
                    onDelete={() => deletePaymentMut.mutate(p.id)}
                    onNfChanged={() => qc.invalidateQueries({ queryKey: ['receivable', receivableId] })}
                  />
                ))}
                {(rec.payments ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-8 text-center text-ink-3">Nenhum pagamento registrado.</td>
                  </tr>
                )}
                {(rec.payments ?? []).length > 0 && (
                  <tr className="font-semibold bg-bg-sunk">
                    <td colSpan={2} className="px-3.5 py-2.5 text-right text-[12px] text-ink-3">Total recebido</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(rec.amount_received)}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSettle && <SettleModal rec={rec} creditBalance={Number(rec.customer?.credit_balance ?? 0)} onClose={() => setShowSettle(false)} onSave={d => payMut.mutate(d)} />}
      {showEdit && <EditReceivableModal rec={rec} onClose={() => setShowEdit(false)} onSave={d => editMut.mutate(d)} />}
    </div>
  );
}
