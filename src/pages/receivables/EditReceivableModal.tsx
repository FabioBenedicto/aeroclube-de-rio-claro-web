import { useState } from 'react';
import { X, Check as CheckIcon } from 'lucide-react';
import DateInput from '../../components/DateInput';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import type { Receivable } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

const modalBase = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
const modalPanel = 'bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]';
const modalHead = 'flex items-start justify-between px-[18px] pt-[18px] pb-4 border-b border-line gap-3';
const modalBody = 'p-[18px] overflow-y-auto flex-1 flex flex-col gap-4';
const modalFoot = 'flex items-center justify-end gap-2 px-[18px] py-3.5 border-t border-line';
const field = 'flex flex-col gap-1.5';
const lbl = 'text-[12px] font-medium text-ink-2';

export function EditReceivableModal({ rec, onClose, onSave }: { rec: Receivable; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({
    title: rec.title,
    description: rec.description ?? '',
    expiration_date: rec.expiration_date?.slice(0, 10) ?? '',
    total_amount: maskCurrency(Math.round(Number(rec.total_amount) * 100).toString()),
  });
  return (
    <div className={modalBase} onClick={onClose}>
      <div className={modalPanel} onClick={e => e.stopPropagation()}>
        <div className={modalHead}>
          <div>
            <h3 className="text-[15px] font-semibold m-0">Editar título</h3>
            <div className="text-[11.5px] text-ink-3 mt-0.5">{rec.id} · {rec.customer?.name}</div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className={modalBody}>
          <div className={field}><label className={lbl}>Título</label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}><label className={lbl}>Vencimento</label><DateInput value={form.expiration_date} onChange={v => setForm(f => ({ ...f, expiration_date: v }))} /></div>
            <div className={field}><label className={lbl}>Valor</label>
              <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                <input inputMode="numeric" className="flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: maskCurrency(e.target.value) }))} />
              </div>
            </div>
          </div>
          <div className={field}><label className={lbl}>Descrição</label>
            <Textarea className="min-h-[60px]" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className={modalFoot}>
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave({ title: form.title, description: form.description || undefined, expiration_date: form.expiration_date || undefined, total_amount: parseCurrency(form.total_amount) })}><CheckIcon size={14} /> Salvar</Button>
        </div>
      </div>
    </div>
  );
}
