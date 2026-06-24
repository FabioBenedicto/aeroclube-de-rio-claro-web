import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Check as CheckIcon } from 'lucide-react';
import { getPeoples } from '../../api/peoples';
import { getReceivables } from '../../api/receivables';
import { formatBRL, receivableStatus } from '../../utils/format';
import type { People, Receivable } from '../../types';
import DateInput from '../../components/DateInput';
import Checkbox from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';

function receivableBelongsToPerson(r: Receivable, id: number): boolean {
  return (
    r.people?.id === id || r.people_id === id || r.person_id === id ||
    r.instructor?.people?.id === id || r.instructor?.people_id === id || r.instructor?.customer_id === id ||
    r.partner?.people?.id === id || r.partner?.people_id === id || r.partner?.customer_id === id ||
    r.employee?.people?.id === id || r.employee?.people_id === id || r.employee?.customer_id === id ||
    r.student?.people?.id === id || r.student?.people_id === id || r.student?.customer_id === id
  ) === true;
}

export function NewInvoiceModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (d: { people_id: number; items: { receivable_id: number; amount: number }[]; expiration_date: string }) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<People | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [dueDate, setDueDate] = useState('');

  const { data: customersData } = useQuery({ queryKey: ['peoples', '', 'all', 1], queryFn: () => getPeoples(undefined, undefined, 1, 9999) });
  const customers = customersData?.data ?? [];

  const { data: receivablesData, isLoading: recsLoading } = useQuery({
    queryKey: ['receivables', 'all', '', 1],
    queryFn: () => getReceivables(undefined, undefined, undefined, undefined, 1, 9999),
    enabled: !!selectedCustomer,
  });
  const receivables = receivablesData?.data ?? [];

  const openRecs = receivables.filter((r: Receivable) =>
    selectedCustomer && receivableBelongsToPerson(r, selectedCustomer.id) && receivableStatus(r) !== 'paid'
  );

  const total = Object.entries(selected).reduce((s, [, v]) => s + v, 0);

  function toggleRec(r: Receivable) {
    const remaining = Number(r.total_amount) - Number(r.amount_received);
    setSelected(s => s[r.id] !== undefined
      ? Object.fromEntries(Object.entries(s).filter(([k]) => Number(k) !== r.id))
      : { ...s, [r.id]: remaining });
  }

  return (
    <Modal onClose={onClose} maxWidth={520}>
      <div className="flex items-start justify-between px-5 py-4 border-b border-line gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink">Nova fatura</span>
          <div className="flex items-center gap-1.5">
            {(['Cliente', 'Títulos'] as const).map((label, i) => {
              const n = (i + 1) as 1 | 2;
              return (
                <span key={n} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${step === n ? 'bg-accent text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                  <span className="text-[11px] text-ink-3">{label}</span>
                  {i < 1 && <ChevronRight size={12} className="text-ink-3" />}
                </span>
              );
            })}
          </div>
        </div>
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:bg-bg-hover hover:text-ink cursor-pointer bg-transparent border-0"
          onClick={onClose}
          aria-label="Fechar"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {step === 1 && (
        <>
          <Modal.Body>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Selecionar cliente</label>
              <Select value={selectedCustomer?.id ?? ''} onChange={e => {
                const c = customers.find((x: People) => x.id === Number(e.target.value)) ?? null;
                setSelectedCustomer(c);
                setSelected({});
              }}>
                <option value="">Selecione</option>
                {customers.map((c: People) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
              <DateInput value={dueDate} onChange={setDueDate} />
            </div>
          </Modal.Body>
          <Modal.Footer justify="end">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" disabled={!selectedCustomer || !dueDate} onClick={() => setStep(2)}>
              Próximo <ChevronRight size={14} />
            </Button>
          </Modal.Footer>
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
                  {recsLoading && <Skeleton.TableRows cols={5} rows={4} />}
                  {!recsLoading && openRecs.length === 0 && <tr><td colSpan={5} className="px-3.5 py-6 text-center text-ink-3">Nenhum título em aberto.</td></tr>}
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
            {Object.keys(selected).length > 0 && (
              <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-line bg-bg-sunk">
                <span className="text-[12px] text-ink-3">{Object.keys(selected).length} título(s) selecionado(s)</span>
                <span className="font-mono font-semibold text-[13px]">R$ {formatBRL(total)}</span>
              </div>
            )}
          </div>
          <Modal.Footer justify="end">
            <Button variant="default" onClick={() => setStep(1)}><ChevronLeft size={14} /> Voltar</Button>
            <Button variant="primary" disabled={Object.keys(selected).length === 0 || total <= 0} onClick={() => onSave({
              people_id: selectedCustomer!.id,
              expiration_date: dueDate,
              items: Object.entries(selected).map(([id, amount]) => ({ receivable_id: Number(id), amount })),
            })}>
              <CheckIcon size={14} /> Gerar fatura
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
