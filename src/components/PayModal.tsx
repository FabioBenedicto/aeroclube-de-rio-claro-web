import { useState } from 'react';
import { Check as CheckIcon } from 'lucide-react';
import { formatBRL } from '../utils/format';
import type { Payable } from '../types';

export default function PayModal({ payable, onClose, onSave }: { payable: Payable; onClose: () => void; onSave: (d: unknown) => void }) {
  const remaining = Number(payable.total_amount) - Number(payable.amount_paid);
  const [mode, setMode] = useState<'total' | 'partial'>('total');
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('pix');
  const effective = mode === 'total' ? remaining : parseFloat(amount) || 0;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3">
          <div>
            <h3 className="text-[15px] font-semibold m-0">Receber</h3>
            <div className="text-[11.5px] text-ink-3 mt-0.5">{payable.title}</div>
          </div>
          <button
            className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
            onClick={onClose}
          >
            <span>✕</span>
          </button>
        </div>

        <div className="p-[18px] overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between px-3.5 py-3 bg-bg-sunk rounded-md">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-0.5">Saldo devedor</div>
              <div className="font-mono text-[16px] font-semibold">R$ {formatBRL(remaining)}</div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">Tipo de pagamento</div>
            <div className="flex gap-2">
              <button
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border cursor-pointer transition-[background,border-color] duration-[80ms] ${mode === 'total' ? 'bg-accent border-accent text-white hover:opacity-90' : 'bg-bg-elev border-line text-ink-2 hover:bg-bg-hover hover:text-ink'}`}
                onClick={() => setMode('total')}
              >
                Total · R$ {formatBRL(remaining)}
              </button>
              <button
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border cursor-pointer transition-[background,border-color] duration-[80ms] ${mode === 'partial' ? 'bg-accent border-accent text-white hover:opacity-90' : 'bg-bg-elev border-line text-ink-2 hover:bg-bg-hover hover:text-ink'}`}
                onClick={() => setMode('partial')}
              >
                Parcial
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Valor pago</label>
              <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                <span className="flex items-center px-2.5 text-[13px] font-mono text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                <input
                  className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none"
                  type="number"
                  step="0.01"
                  value={mode === 'total' ? String(remaining) : amount}
                  onChange={e => setAmount(e.target.value)}
                  disabled={mode === 'total'}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
              <select
                className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] cursor-pointer"
                value={method}
                onChange={e => setMethod(e.target.value)}
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="transferencia">Transferência</option>
                <option value="credito">Cartão de crédito</option>
                <option value="debito">Cartão de débito</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line">
          <span className="text-[11.5px] text-ink-3 mr-auto">
            Saldo restante: <strong className="font-mono">R$ {formatBRL(Math.max(0, remaining - effective))}</strong>
          </span>
          <button
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90"
            onClick={() => onSave({ amount: effective, method, paid_at: new Date().toISOString() })}
          >
            <CheckIcon size={14} /> Confirmar pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
