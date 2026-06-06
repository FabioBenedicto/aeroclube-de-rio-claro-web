import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import type { Plane } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface Props { mode: 'new' | 'edit'; plane?: Plane; onClose: () => void; onSave: (data: unknown, id?: number) => void; }

const STEPS = ['Tipo', 'Detalhes'];

export default function PlaneModal({ mode, plane, onClose, onSave }: Props) {
  const isNew = mode === 'new';
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    registration: plane?.registration ?? '',
    model: plane?.model ?? '',
    aircraft_type: plane?.aircraft_type ?? 'airplane',
    flight_hour_value: plane?.flight_hour_value
      ? maskCurrency(Math.round(Number(plane.flight_hour_value) * 100).toString())
      : '',
  });

  const isGlider = form.aircraft_type === 'glider';

  function handleNextStep1() {
    setError('');
    setStep(2);
  }

  function handleSave() {
    if (!form.registration.trim()) { setError('Informe a matrícula.'); return; }
    if (!isGlider && !form.flight_hour_value) { setError('Informe o valor por hora.'); return; }
    setError('');
    onSave(
      {
        registration: form.registration,
        model: form.model || undefined,
        aircraft_type: form.aircraft_type,
        ...(!isGlider && { flight_hour_value: parseCurrency(form.flight_hour_value) }),
      },
      plane?.id,
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0">{isNew ? 'Nova aeronave' : 'Editar aeronave'}</h3>
            {isNew && (
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
            )}
          </div>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">

          {/* Step 1 — tipo de aeronave */}
          {isNew && step === 1 && (
            <div className="flex flex-col gap-2">
              {(['airplane', 'glider'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, aircraft_type: type }))}
                  className={`text-left px-4 py-3 rounded-lg border transition-colors duration-100 cursor-pointer ${form.aircraft_type === type ? 'border-accent bg-accent/5 text-ink' : 'border-line bg-bg hover:bg-bg-hover text-ink'}`}
                >
                  <div className="text-[13px] font-medium">{type === 'airplane' ? 'Avião' : 'Planador'}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5">
                    {type === 'airplane' ? 'Cobrança por hora de voo' : 'Cobrança por tempo (regra global)'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 / Edit — detalhes */}
          {(!isNew || step === 2) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Matrícula *</label>
                  <Input className="font-mono" maxLength={10} value={form.registration} onChange={e => setForm(f => ({ ...f, registration: e.target.value.toUpperCase() }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Modelo</label>
                  <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
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
                      value={form.flight_hour_value}
                      onChange={e => setForm(f => ({ ...f, flight_hour_value: maskCurrency(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              {isNew && isGlider && (
                <div className="text-[12px] text-ink-3 bg-bg-sunk border border-line rounded-md px-3 py-2.5">
                  Planadores usam os parâmetros de cobrança configurados em <strong>Configurações → Planador</strong> (franquia inicial + valor por minuto excedente).
                </div>
              )}
            </>
          )}

          {error && <div className="text-[13px] text-danger">{error}</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          {!isNew ? (
            <>
              <Button variant="default" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave}><Check size={14} /> Salvar</Button>
            </>
          ) : step === 1 ? (
            <>
              <Button variant="default" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleNextStep1}>Próximo <ChevronRight size={14} /></Button>
            </>
          ) : (
            <>
              <Button variant="default" onClick={() => { setError(''); setStep(1); }}><ChevronLeft size={14} /> Voltar</Button>
              <Button variant="primary" onClick={handleSave}><Check size={14} /> Cadastrar</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
