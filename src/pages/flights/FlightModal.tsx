import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Flight, Person, Plane } from '../../types';
import DateTimeInput from '../../components/DateTimeInput';

const FLIGHT_TYPES = ['Instrução', 'Sócio Solo', 'Sócio Duplo Comando'];

function needsInstructor(type: string) {
  return type === 'Instrução' || type === 'Sócio Duplo Comando';
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultExpiration(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface Props {
  mode: 'new' | 'edit';
  flight?: Flight;
  customers: Person[];
  planes: Plane[];
  initialCustomerId?: number;
  initialPlaneId?: number;
  onClose: () => void;
  onSave: (data: unknown) => void;
}

const inputCls = 'w-full px-3 py-1.5 text-[13px] bg-bg border border-line rounded-md text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100 placeholder:text-ink-3';

const TYPE_DESCRIPTIONS: Record<string, string> = {
  'Instrução': 'Voo com instrutor obrigatório. Gera título a receber do cliente e título a pagar ao instrutor.',
  'Sócio Solo': 'Voo individual sem instrutor. Gera apenas título a receber do cliente.',
  'Sócio Duplo Comando': 'Voo em duplo comando com instrutor. Gera título a receber do cliente e título a pagar ao instrutor.',
};

export default function FlightModal({ mode, flight, customers, planes, initialCustomerId, initialPlaneId, onClose, onSave }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [flightType, setFlightType] = useState(flight?.type ?? '');

  const [form, setForm] = useState({
    plane_id: (initialPlaneId ?? flight?.plane_id)?.toString() ?? '',
    customer_id: (initialCustomerId ?? flight?.customer_id)?.toString() ?? '',
    instructor_id: flight?.instructor_id?.toString() ?? '',
    aircraft_type: flight?.aircraft_type ?? 'airplane',
    origin: flight?.origin ?? '',
    destination: flight?.destination ?? '',
    start_datetime: toDatetimeLocal(flight?.start_date ?? ''),
    end_datetime: toDatetimeLocal(flight?.end_date ?? ''),
  });

  const [recTitle, setRecTitle] = useState('');
  const [recExpiration, setRecExpiration] = useState(defaultExpiration());

  const [payTitle, setPayTitle] = useState('');
  const [payDueDate, setPayDueDate] = useState(defaultExpiration());

  const [error, setError] = useState('');

  const instructors = customers
    .filter(c => c.categories.includes('instrutor') && c.instructors?.length)
    .map(c => ({ instructorId: c.instructors[0].id, name: c.name }));

  const withInstructor = needsInstructor(flightType);
  const isNew = mode === 'new';

  const STEPS = isNew
    ? withInstructor
      ? ['Tipo', 'Detalhes', 'Recebível', 'Pagável']
      : ['Tipo', 'Detalhes', 'Recebível']
    : [];

  function handleNextStep1() {
    if (!flightType) { setError('Selecione o tipo de voo.'); return; }
    setError('');
    setStep(2);
  }

  function handleNextStep2() {
    if (!form.plane_id) { setError('Selecione a aeronave.'); return; }
    if (!form.customer_id) { setError('Selecione o cliente.'); return; }
    if (!form.start_datetime) { setError('Informe a data de início.'); return; }
    if (withInstructor && !form.instructor_id) { setError('Instrutor é obrigatório para este tipo de voo.'); return; }
    if (!form.origin.trim()) { setError('Informe a origem.'); return; }
    if (!form.destination.trim()) { setError('Informe o destino.'); return; }
    if (!form.end_datetime) { setError('Informe a data de fim.'); return; }
    setError('');
    setStep(3);
  }

  function handleNextStep3() {
    if (!recTitle.trim()) { setError('Informe o título do recebível.'); return; }
    setError('');
    if (withInstructor) setStep(4);
    else handleSave();
  }

  function handleSave() {
    if (mode === 'edit') {
      if (!form.plane_id) { setError('Selecione a aeronave.'); return; }
      if (!form.customer_id) { setError('Selecione o cliente.'); return; }
      if (!form.start_datetime) { setError('Informe a data de início.'); return; }
      if (withInstructor && !form.instructor_id) { setError('Instrutor é obrigatório para este tipo de voo.'); return; }
      if (!form.origin.trim()) { setError('Informe a origem.'); return; }
      if (!form.destination.trim()) { setError('Informe o destino.'); return; }
      if (!form.end_datetime) { setError('Informe a data de fim.'); return; }
    }
    if (mode === 'new' && withInstructor && !payTitle.trim()) { setError('Informe o título do pagável.'); return; }
    setError('');
    onSave({
      plane_id: Number(form.plane_id),
      customer_id: Number(form.customer_id),
      instructor_id: form.instructor_id ? Number(form.instructor_id) : undefined,
      aircraft_type: form.aircraft_type,
      type: flightType,
      double_command: withInstructor,
      origin: form.origin,
      destination: form.destination,
      start_date: new Date(form.start_datetime).toISOString(),
      end_date: form.end_datetime ? new Date(form.end_datetime).toISOString() : undefined,
      ...(mode === 'new' && {
        receivable_title: recTitle.trim(),
        receivable_expiration_date: recExpiration ? new Date(recExpiration).toISOString() : undefined,
        receivable_product: 'voo',
        ...(withInstructor && {
          payable_title: payTitle.trim() || undefined,
          payable_due_date: payDueDate ? new Date(payDueDate).toISOString() : undefined,
        }),
      }),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[540px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-semibold m-0">{isNew ? 'Novo voo' : 'Editar voo'}</h3>
            {isNew && STEPS.length > 0 && (
              <div className="flex items-center gap-1.5">
                {STEPS.map((label, i) => {
                  const n = i + 1;
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
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">

          {/* Step 1 — tipo de voo */}
          {isNew && step === 1 && (
            <div className="flex flex-col gap-2">
              {FLIGHT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setFlightType(t)}
                  className={`text-left px-4 py-3 rounded-lg border transition-colors duration-100 cursor-pointer ${flightType === t ? 'border-accent bg-accent/5 text-ink' : 'border-line bg-bg hover:bg-bg-hover text-ink'}`}
                >
                  <div className="text-[13px] font-medium">{t}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5">{TYPE_DESCRIPTIONS[t]}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 / Edit — detalhes */}
          {((!isNew) || step === 2) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Aeronave *</label>
                  <select
                    className={inputCls}
                    value={form.plane_id}
                    onChange={e => {
                      const planeId = e.target.value;
                      const selected = planes.find(p => p.id === Number(planeId));
                      setForm(f => ({ ...f, plane_id: planeId, aircraft_type: selected?.aircraft_type ?? f.aircraft_type }));
                    }}
                  >
                    <option value="">Selecione</option>
                    {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''} {p.aircraft_type === 'glider' ? '(Planador)' : ''}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Tipo de aeronave</label>
                  <select className={inputCls} value={form.aircraft_type} onChange={e => setForm(f => ({ ...f, aircraft_type: e.target.value }))}>
                    <option value="airplane">Avião</option>
                    <option value="glider">Planador</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Cliente *</label>
                  <select className={inputCls} value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                    <option value="">Selecione</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Instrutor{withInstructor ? ' *' : ' (opcional)'}</label>
                  <select className={inputCls} value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}>
                    <option value="">{withInstructor ? 'Selecione' : 'Nenhum'}</option>
                    {instructors.map(i => <option key={i.instructorId} value={i.instructorId}>{i.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Origem (ICAO) *</label>
                  <input className={`${inputCls} font-mono`} value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Destino (ICAO) *</label>
                  <input className={`${inputCls} font-mono`} value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Início *</label>
                  <DateTimeInput value={form.start_datetime} onChange={v => setForm(f => ({ ...f, start_datetime: v }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Fim *</label>
                  <DateTimeInput value={form.end_datetime} onChange={v => setForm(f => ({ ...f, end_datetime: v }))} />
                </div>
              </div>
            </>
          )}

          {/* Step 3 — recebível */}
          {isNew && step === 3 && (
            <>
              <p className="text-[12px] text-ink-3 m-0">
                Um título a receber será criado automaticamente ao registrar o voo.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Título do recebível *</label>
                <input className={inputCls} value={recTitle} onChange={e => setRecTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
                <input type="date" className={inputCls} value={recExpiration} onChange={e => setRecExpiration(e.target.value)} />
              </div>
            </>
          )}

          {/* Step 4 — pagável (instrutor) */}
          {isNew && step === 4 && (
            <>
              <p className="text-[12px] text-ink-3 m-0">
                Um título a pagar será criado para o instrutor. O valor é calculado automaticamente com base no percentual de instrução configurado.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Título do pagável *</label>
                <input className={inputCls} value={payTitle} onChange={e => setPayTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
                <input type="date" className={inputCls} value={payDueDate} onChange={e => setPayDueDate(e.target.value)} />
              </div>
            </>
          )}

          {error && <div className="text-[13px] text-danger">{error}</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          {!isNew ? (
            <>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>Cancelar</button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={handleSave}><Check size={14} /> Salvar</button>
            </>
          ) : step === 1 ? (
            <>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>Cancelar</button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={handleNextStep1}>Próximo <ChevronRight size={14} /></button>
            </>
          ) : step === 2 ? (
            <>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={() => { setError(''); setStep(1); }}><ChevronLeft size={14} /> Voltar</button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={handleNextStep2}>Próximo <ChevronRight size={14} /></button>
            </>
          ) : step === 3 ? (
            <>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={() => { setError(''); setStep(2); }}><ChevronLeft size={14} /> Voltar</button>
              {withInstructor
                ? <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={handleNextStep3}>Próximo <ChevronRight size={14} /></button>
                : <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={handleNextStep3}><Check size={14} /> Registrar</button>
              }
            </>
          ) : (
            <>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={() => { setError(''); setStep(3); }}><ChevronLeft size={14} /> Voltar</button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={handleSave}><Check size={14} /> Registrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
