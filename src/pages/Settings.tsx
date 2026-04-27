import { useState } from 'react';
import { Check } from 'lucide-react';

export default function Settings() {
  const [instructorPct, setInstructorPct] = useState(() => Number(localStorage.getItem('acrc.instructorPct') ?? 20));
  const [monthlyFee, setMonthlyFee] = useState(() => Number(localStorage.getItem('acrc.monthlyFee') ?? 320));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('acrc.instructorPct', String(instructorPct));
    localStorage.setItem('acrc.monthlyFee', String(monthlyFee));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-sub">Parâmetros do sistema</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, maxWidth: 480 }}>
        <div className="stack">
          <div className="field">
            <label>Porcentagem do instrutor (%)</label>
            <div className="row" style={{ gap: 12 }}>
              <input type="range" min={0} max={50} step={1} value={instructorPct} onChange={e => setInstructorPct(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <input className="input mono" type="number" min={0} max={50} step={1} value={instructorPct} onChange={e => setInstructorPct(Number(e.target.value))} style={{ width: 70, textAlign: 'right' }} />
              <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>%</span>
            </div>
          </div>

          <div className="field">
            <label>Mensalidade de sócios (R$)</label>
            <div className="input-group" style={{ maxWidth: 200 }}>
              <span className="prefix">R$</span>
              <input className="input mono" type="number" step="0.01" value={monthlyFee} onChange={e => setMonthlyFee(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={handleSave}>
          <Check size={14} /> {saved ? 'Salvo!' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}
