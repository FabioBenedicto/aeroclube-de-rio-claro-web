import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import type { Plane } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

interface Props { mode: 'new' | 'edit'; plane?: Plane; onClose: () => void; onSave: (data: unknown, id?: number) => void; }

const STEPS = ['Tipo', 'Detalhes'];

export default function PlaneModal({ mode, plane, onClose, onSave }: Props) {
  const isNew = mode === 'new';
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    registration: plane?.registration ?? '',
    model: plane?.model ?? '',
    type: plane?.type ?? 'AIRPLANE',
    flight_hour_value: plane?.flight_hour_value
      ? maskCurrency(Math.round(Number(plane.flight_hour_value) * 100).toString())
      : '',
  });

  const isGlider = form.type === 'GLIDER';

  function handleSave() {
    if (!form.registration.trim()) { setError('Informe a matrícula.'); return; }
    if (!isGlider && !form.flight_hour_value) { setError('Informe o valor por hora.'); return; }
    setError('');
    onSave(
      {
        registration: form.registration,
        model: form.model || undefined,
        type: form.type,
        ...(!isGlider && { flight_hour_value: parseCurrency(form.flight_hour_value) }),
      },
      plane?.id,
    );
  }

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-line gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink">{isNew ? 'Nova aeronave' : 'Editar aeronave'}</span>
          <div className="flex items-center gap-1.5">
            {STEPS.map((label, i) => {
              const n = (i + 1) as 1 | 2;
              return (
                <span key={n} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${step === n ? 'bg-accent text-white' : 'bg-bg-sunk text-ink-3'}`}>{n}</span>
                  <span className="text-[11px] text-ink-3">{label}</span>
                  {i < STEPS.length - 1 && <ChevronRight size={12} className="text-ink-3" />}
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

      <Modal.Body>
        {step === 1 && (
          <div className="flex flex-col gap-2">
            {(['AIRPLANE', 'GLIDER'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: type }))}
                className={`text-left px-4 py-3 rounded-lg border transition-colors duration-100 cursor-pointer ${form.type === type ? 'border-accent bg-accent/5 text-ink' : 'border-line bg-bg hover:bg-bg-hover text-ink'}`}
              >
                <div className="text-[13px] font-medium">{type === 'AIRPLANE' ? 'Avião' : 'Planador'}</div>
                <div className="text-[12px] text-ink-3 mt-0.5">
                  {type === 'AIRPLANE' ? 'Cobrança por hora de voo' : 'Cobrança por tempo (regra global)'}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Matrícula *</label>
                <Input className="font-mono" maxLength={10} placeholder="PP-XXX" value={form.registration} onChange={e => setForm(f => ({ ...f, registration: e.target.value.toUpperCase() }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Modelo</label>
                <Input placeholder="Cessna 172" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
              </div>
            </div>

            {!isGlider && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Valor/hora (R$) *</label>
                <div className="flex items-stretch overflow-hidden border border-line rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100">
                  <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg border-r border-line select-none">R$</span>
                  <input
                    className="flex-1 px-3 py-1.5 text-[13px] font-mono bg-bg text-ink outline-none border-0"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={form.flight_hour_value}
                    onChange={e => setForm(f => ({ ...f, flight_hour_value: maskCurrency(e.target.value) }))}
                  />
                </div>
              </div>
            )}

            {isGlider && (
              <div className="text-[12px] text-ink-3 bg-bg-sunk border border-line rounded-md px-3 py-2.5">
                Planadores usam os parâmetros de cobrança configurados em <strong>Configurações → Planador</strong> (franquia inicial + valor por minuto excedente).
              </div>
            )}
          </>
        )}

        {error && <div className="text-[13px] text-danger">{error}</div>}
      </Modal.Body>

      <Modal.Footer justify="end">
        {step === 1 ? (
          <>
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={() => { setError(''); setStep(2); }}>Próximo <ChevronRight size={14} /></Button>
          </>
        ) : (
          <>
            <Button variant="default" onClick={() => { setError(''); setStep(1); }}><ChevronLeft size={14} /> Voltar</Button>
            <Button variant="primary" onClick={handleSave}><Check size={14} /> {isNew ? 'Cadastrar' : 'Salvar'}</Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
