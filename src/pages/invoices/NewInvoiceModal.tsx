import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronRight, ChevronLeft, Check as CheckIcon } from 'lucide-react';
import { getPeoples } from '../../api/peoples';
import { getReceivables } from '../../api/receivables';
import { formatBRL, receivableStatus } from '../../utils/format';
import type { Person, Receivable } from '../../types';
import DateInput from '../../components/DateInput';
import Checkbox from '../../components/ui/Checkbox';

const modalBase = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
const modalHead = 'flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3';
const modalFoot = 'flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line';
const sel = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] cursor-pointer';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60';
const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink';

export function NewInvoiceModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (d: { customer_id: number; items: { receivable_id: number; amount: number }[]; payment_method?: string; due_date?: string }) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Person | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [method, setMethod] = useState('PIX');
  const [dueDate, setDueDate] = useState('');

  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const customers = customersData?.data ?? [];

  const { data: receivablesData } = useQuery({ queryKey: ['receivables', 'all', '', 1], queryFn: () => getReceivables(undefined, undefined, undefined, undefined, 1, 9999), enabled: !!selectedCustomer });
  const receivables = receivablesData?.data ?? [];

  const openRecs = receivables.filter((r: Receivable) => selectedCustomer && r.client_id === selectedCustomer.id && receivableStatus(r) !== 'paid');
  const total = Object.entries(selected).reduce((s, [, v]) => s + v, 0);

  function toggleRec(r: Receivable) {
    const remaining = Number(r.total_amount) - Number(r.amount_received);
    setSelected(s => s[r.id] !== undefined
      ? Object.fromEntries(Object.entries(s).filter(([k]) => Number(k) !== r.id))
      : { ...s, [r.id]: remaining });
  }

  return (
    <div className={modalBase} onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[520px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0">Nova fatura</h3>
            <div className="flex items-center gap-1.5">
              {(['Cliente', 'Títulos', 'Pagamento'] as const).map((label, i) => {
                const n = (i + 1) as 1 | 2 | 3;
                return (
                  <span key={n} className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${step === n ? 'bg-accent text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                    <span className="text-[11px] text-ink-3">{label}</span>
                    {i < 2 && <ChevronRight size={12} className="text-ink-3" />}
                  </span>
                );
              })}
            </div>
          </div>
          <button className={iconBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {step === 1 && (
          <>
            <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Selecionar cliente</label>
                <select className={sel} value={selectedCustomer?.id ?? ''} onChange={e => { const c = customers.find((x: Person) => x.id === Number(e.target.value)) ?? null; setSelectedCustomer(c); setSelected({}); }}>
                  <option value="">Selecione</option>
                  {customers.map((c: Person) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className={modalFoot}>
              <button className={btnCancel} onClick={onClose}>Cancelar</button>
              <button className={btnPrimary} disabled={!selectedCustomer} onClick={() => setStep(2)}>Próximo <ChevronRight size={14} /></button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="overflow-y-auto flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line w-9"></th>
                      <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Título</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Recebido</th>
                      <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">A incluir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openRecs.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título em aberto.</td></tr>}
                    {openRecs.map((r: Receivable) => {
                      const remaining = Number(r.total_amount) - Number(r.amount_received);
                      const checked = r.id in selected;
                      return (
                        <tr key={r.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => toggleRec(r)}>
                          <td className="px-3.5 py-2.5 border-b border-line w-9"><Checkbox checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} /></td>
                          <td className="px-3.5 py-2.5 border-b border-line">{r.title}</td>
                          <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(r.total_amount)}</td>
                          <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">{Number(r.amount_received) > 0 ? `R$ ${formatBRL(r.amount_received)}` : '—'}</td>
                          <td className="px-3.5 py-2.5 border-b border-line text-right font-mono">
                            {checked ? (
                              <input type="number" step="0.01" min="0.01" max={remaining}
                                className="w-[90px] px-1.5 py-0.5 border border-line rounded bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent text-right"
                                value={selected[r.id]} onClick={e => e.stopPropagation()}
                                onChange={e => { const v = Math.min(parseFloat(e.target.value) || 0, remaining); setSelected(s => ({ ...s, [r.id]: v })); }} />
                            ) : `R$ ${formatBRL(remaining)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={modalFoot}>
              <button className={btnCancel} onClick={() => setStep(1)}><ChevronLeft size={14} /> Voltar</button>
              <button className={btnPrimary} disabled={Object.keys(selected).length === 0 || total <= 0} onClick={() => setStep(3)}>
                Próximo <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
                  <select className={sel} value={method} onChange={e => setMethod(e.target.value)}>
                    <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Cheque</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Vencimento <span className="text-ink-3 font-normal">(opcional)</span></label>
                  <DateInput value={dueDate} onChange={setDueDate} />
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-bg-sunk border border-line rounded-lg">
                <span className="text-[12px] text-ink-3 font-medium">Total da fatura</span>
                <span className="font-mono font-semibold text-[14px]">R$ {formatBRL(total)}</span>
              </div>
            </div>
            <div className={modalFoot}>
              <button className={btnCancel} onClick={() => setStep(2)}><ChevronLeft size={14} /> Voltar</button>
              <button className={btnPrimary} onClick={() => onSave({ customer_id: selectedCustomer!.id, payment_method: method, ...(dueDate && { due_date: dueDate }), items: Object.entries(selected).map(([id, amount]) => ({ receivable_id: Number(id), amount })) })}>
                <CheckIcon size={14} /> Gerar fatura
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
