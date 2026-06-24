import { useState } from 'react';
import { Check as CheckIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import DateInput from '../../components/DateInput';
import { formatBRL } from '../../utils/format';
import Modal from '../../components/ui/Modal';

export function CnabBaixaModal({ billId, totalAmount, isPending, onClose, onSave }: {
  billId: number;
  totalAmount?: number;
  isPending?: boolean;
  onClose: () => void;
  onSave: (data: { payment_method: string; payment_date: string }) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <Modal onClose={onClose} maxWidth={400}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-line gap-3 flex-shrink-0">
        <div>
          <span className="text-[15px] font-semibold text-ink">Dar baixa no boleto</span>
          <div className="text-[11.5px] text-ink-3 mt-0.5">Fatura #{billId}</div>
        </div>
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:bg-bg-hover hover:text-ink cursor-pointer bg-transparent border-0"
          onClick={onClose}
          aria-label="Fechar"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <Modal.Body>
        {totalAmount !== undefined && (
          <div className="flex items-center justify-between px-3.5 py-3 bg-bg-sunk rounded-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Valor total da fatura</div>
            <div className="font-mono text-[16px] font-semibold">R$ {formatBRL(totalAmount)}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Forma de pagamento</label>
            <div className="h-9 flex items-center px-3 border border-line rounded-md bg-bg-sunk text-[13px] text-ink-2">
              Boleto
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Data do pagamento</label>
            <DateInput value={date} onChange={setDate} />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer justify="end">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button
          variant="primary"
          disabled={!date || isPending}
          onClick={() => onSave({ payment_method: 'boleto', payment_date: date })}
        >
          <CheckIcon size={14} /> {isPending ? 'Aguarde…' : 'Confirmar baixa'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
