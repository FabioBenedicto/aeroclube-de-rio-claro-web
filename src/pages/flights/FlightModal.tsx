import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Flight, Plane } from '../../types';
import { getPeoples } from '../../api/peoples';
import { getReceivableTypes } from '../../api/receivable-types';
import { getPayableTypes } from '../../api/payable-types';
import DateTimeInput from '../../components/DateTimeInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';

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
  planes: Plane[];
  initialCustomerId?: number;
  initialPlaneId?: number;
  initialStudentId?: number;
  initialPartnerId?: number;
  onClose: () => void;
  onSave: (data: unknown) => void;
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  'Instrução': 'Voo com instrutor obrigatório. Gera título a receber do cliente e título a pagar ao instrutor.',
  'Sócio Solo': 'Voo individual sem instrutor. Gera apenas título a receber do cliente.',
  'Sócio Duplo Comando': 'Voo em duplo comando com instrutor. Gera título a receber do cliente e título a pagar ao instrutor.',
};

export default function FlightModal({ mode, flight, planes, initialCustomerId, initialPlaneId, initialStudentId, initialPartnerId, onClose, onSave }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [flightType, setFlightType] = useState(flight?.type ?? '');

  const customerCategory = flightType === 'Instrução' ? 'student' : flightType ? 'partner' : undefined;
  const { data: customersData } = useQuery({
    queryKey: ['peoples', 'modal', customerCategory],
    queryFn: () => getPeoples(undefined, customerCategory, 1, 200),
    enabled: !!flightType,
  });
  const customers = customersData?.data ?? [];

  const { data: instructorsData } = useQuery({
    queryKey: ['peoples', 'modal', 'instructor'],
    queryFn: () => getPeoples(undefined, 'instructor', 1, 200),
  });
  const instructors = (instructorsData?.data ?? [])
    .filter(c => c.instructors != null)
    .map(c => ({ instructorId: c.instructors!.id, name: c.name }));

  const [form, setForm] = useState({
    plane_id: (initialPlaneId ?? flight?.aircraft_id)?.toString() ?? '',
    customer_id: (initialCustomerId ?? flight?.people_id)?.toString() ?? '',
    instructor_id: flight?.instructor_id?.toString() ?? '',
    origin: flight?.origin ?? '',
    destination: flight?.destination ?? '',
    start_datetime: toDatetimeLocal(flight?.start_date ?? ''),
    end_datetime: toDatetimeLocal(flight?.end_date ?? ''),
  });

  const selectedPlane = planes.find(p => p.id === Number(form.plane_id));
  const aircraftType = selectedPlane?.type ?? flight?.aircraft?.type ?? 'AIRPLANE';

  const [recTitle, setRecTitle] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recExpiration, setRecExpiration] = useState(defaultExpiration());
  const [recTypeId, setRecTypeId] = useState('');

  const { data: receivableTypes = [] } = useQuery({ queryKey: ['receivable-types'], queryFn: getReceivableTypes });
  const { data: payableTypes = [] } = useQuery({ queryKey: ['payable-types'], queryFn: getPayableTypes });

  useEffect(() => {
    if (receivableTypes.length > 0 && !recTypeId) {
      setRecTypeId(String(receivableTypes[0].id));
    }
  }, [receivableTypes]);

  const [payTypeId, setPayTypeId] = useState('');

  useEffect(() => {
    if (payableTypes.length > 0 && !payTypeId) {
      setPayTypeId(String(payableTypes[0].id));
    }
  }, [payableTypes]);

  const [payTitle, setPayTitle] = useState('');
  const [payDescription, setPayDescription] = useState('');
  const [payDueDate, setPayDueDate] = useState(defaultExpiration());

  const [error, setError] = useState('');


  const withInstructor = needsInstructor(flightType);
  const isNew = mode === 'new';

  const STEPS = isNew
    ? withInstructor
      ? ['Tipo', 'Detalhes', 'Recebível', 'Pagável']
      : ['Tipo', 'Detalhes', 'Recebível']
    : ['Tipo', 'Detalhes'];

  // suppress unused variable warning
  void aircraftType;

  function handleNextStep1() {
    if (!flightType) { setError('Selecione o tipo de voo.'); return; }
    if (mode === 'new') setForm(f => ({ ...f, customer_id: '' }));
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
    if (!form.plane_id) { setError('Selecione a aeronave.'); return; }
    if (!form.customer_id) { setError('Selecione o cliente.'); return; }
    if (!form.start_datetime) { setError('Informe a data de início.'); return; }
    if (withInstructor && !form.instructor_id) { setError('Instrutor é obrigatório para este tipo de voo.'); return; }
    if (!form.origin.trim()) { setError('Informe a origem.'); return; }
    if (!form.destination.trim()) { setError('Informe o destino.'); return; }
    if (mode === 'new' && withInstructor && !payTitle.trim()) { setError('Informe o título do pagável.'); return; }
    setError('');
    onSave({
      aircraft_id: Number(form.plane_id),
      people_id: Number(form.customer_id),
      ...(initialStudentId && { student_id: initialStudentId }),
      ...(initialPartnerId && { partner_id: initialPartnerId }),
      instructor_id: form.instructor_id ? Number(form.instructor_id) : undefined,
      type: flightType,
      origin: form.origin,
      destination: form.destination,
      start_date: new Date(form.start_datetime).toISOString(),
      end_date: form.end_datetime ? new Date(form.end_datetime).toISOString() : undefined,
      ...(isNew && {
        receivable_title: recTitle.trim(),
        receivable_description: recDescription.trim() || undefined,
        receivable_expiration_date: recExpiration ? new Date(recExpiration).toISOString() : undefined,
        receivable_type_id: Number(recTypeId),
        ...(withInstructor && {
          payable_type_id: payTypeId ? Number(payTypeId) : undefined,
          payable_title: payTitle.trim() || undefined,
          payable_description: payDescription.trim() || undefined,
          payable_due_date: payDueDate ? new Date(payDueDate).toISOString() : undefined,
        }),
      }),
    });
  }

  return (
    <Modal onClose={onClose} maxWidth={540}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-line gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink">{isNew ? 'Novo voo' : 'Editar voo'}</span>
          {STEPS.length > 0 && (
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

        {step === 2 && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Aeronave *</label>
              <Select value={form.plane_id} onChange={e => setForm(f => ({ ...f, plane_id: e.target.value }))}>
                <option value="">Selecione</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.registration}{p.model ? ` · ${p.model}` : ''} {p.type === 'GLIDER' ? '(Planador)' : ''}</option>)}
              </Select>
            </div>
            <div className={withInstructor ? 'grid grid-cols-2 gap-4' : ''}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Cliente *</label>
                <Select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                  <option value="">Selecione</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              {withInstructor && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Instrutor *</label>
                  <Select value={form.instructor_id} onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}>
                    <option value="">Selecione</option>
                    {instructors.map(i => <option key={i.instructorId} value={i.instructorId}>{i.name}</option>)}
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Origem (ICAO) *</label>
                <Input className="font-mono" placeholder="SDRC" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Destino (ICAO) *</label>
                <Input className="font-mono" placeholder="SBRP" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Início *</label>
                <DateTimeInput value={form.start_datetime} onChange={v => setForm(f => ({ ...f, start_datetime: v }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Fim</label>
                <DateTimeInput value={form.end_datetime} onChange={v => setForm(f => ({ ...f, end_datetime: v }))} />
              </div>
            </div>
          </>
        )}

        {isNew && step === 3 && (
          <>
            <p className="text-[12px] text-ink-3 m-0">
              Um título a receber será criado automaticamente ao registrar o voo.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Título do recebível *</label>
              <Input placeholder="Ex: Mensalidade voo" value={recTitle} onChange={e => setRecTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Descrição</label>
              <Input placeholder="Descrição opcional" value={recDescription} onChange={e => setRecDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Tipo de recebível</label>
                <Select value={recTypeId} onChange={e => setRecTypeId(e.target.value)}>
                  {receivableTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
                <Input type="date" value={recExpiration} onChange={e => setRecExpiration(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {isNew && step === 4 && (
          <>
            <p className="text-[12px] text-ink-3 m-0">
              Um título a pagar será criado para o instrutor. O valor é calculado automaticamente com base no percentual de instrução configurado.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Título do pagável *</label>
              <Input placeholder="Ex: Instrução voo" value={payTitle} onChange={e => setPayTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Descrição</label>
              <Input placeholder="Descrição opcional" value={payDescription} onChange={e => setPayDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Tipo de pagável</label>
                <Select value={payTypeId} onChange={e => setPayTypeId(e.target.value)}>
                  {payableTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
                <Input type="date" value={payDueDate} onChange={e => setPayDueDate(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {error && <div className="text-[13px] text-danger">{error}</div>}
      </Modal.Body>

      <Modal.Footer justify="end">
        {step === 1 ? (
          <>
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleNextStep1}>Próximo <ChevronRight size={14} /></Button>
          </>
        ) : step === 2 ? (
          !isNew ? (
            <>
              <Button variant="default" onClick={() => { setError(''); setStep(1); }}><ChevronLeft size={14} /> Voltar</Button>
              <Button variant="primary" onClick={handleSave}><Check size={14} /> Salvar</Button>
            </>
          ) : (
            <>
              <Button variant="default" onClick={() => { setError(''); setStep(1); }}><ChevronLeft size={14} /> Voltar</Button>
              <Button variant="primary" onClick={handleNextStep2}>Próximo <ChevronRight size={14} /></Button>
            </>
          )
        ) : step === 3 ? (
          <>
            <Button variant="default" onClick={() => { setError(''); setStep(2); }}><ChevronLeft size={14} /> Voltar</Button>
            {withInstructor
              ? <Button variant="primary" onClick={handleNextStep3}>Próximo <ChevronRight size={14} /></Button>
              : <Button variant="primary" onClick={handleNextStep3}><Check size={14} /> Registrar</Button>
            }
          </>
        ) : (
          <>
            <Button variant="default" onClick={() => { setError(''); setStep(3); }}><ChevronLeft size={14} /> Voltar</Button>
            <Button variant="primary" onClick={handleSave}><Check size={14} /> Registrar</Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
