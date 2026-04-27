import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { login as apiLogin } from '../api/auth';
import { Sun, Moon, Lock } from 'lucide-react';

function BrandMarkLg() {
  return (
    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center' }}>
      <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5v17M3.5 12h17" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

function BrandMarkSm() {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--ink)', color: 'var(--bg)', display: 'grid', placeItems: 'center' }}>
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5v17M3.5 12h17" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, access_token } = await apiLogin(email, password);
      login(user, access_token);
      navigate('/dashboard');
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-visual">
        <div className="login-brand-lg">
          <BrandMarkLg />
          <div>
            <div className="brand-title" style={{ color: 'inherit', fontSize: 15 }}>Aeroclube de Rio Claro</div>
            <div className="brand-sub" style={{ color: 'rgba(255,255,255,0.5)' }}>Sistema Financeiro · Fundado 1952</div>
          </div>
        </div>
        <div className="login-quote">
          <h2>Gestão <strong>financeira</strong> dos <strong>voos, sócios e instrutores</strong> em um único lugar.</h2>
          <p>Controle de títulos a receber e a pagar, baixas parciais e créditos de alunos.</p>
        </div>
        <div className="login-meta">
          <div><div style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, marginBottom: 2 }}>ICAO</div><div className="mono">SDRK</div></div>
          <div><div style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, marginBottom: 2 }}>Coordenadas</div><div className="mono">22°24′S 47°34′W</div></div>
          <div><div style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, marginBottom: 2 }}>Elevação</div><div className="mono">2001 ft</div></div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div className="row" style={{ gap: 10 }}>
              <BrandMarkSm />
              <span style={{ fontWeight: 600, fontSize: 13 }}>ACRC · Financeiro</span>
            </div>
            <div className="theme-toggle">
              <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={13} /></button>
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={13} /></button>
            </div>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 6 }}>Entrar na sua conta</h1>
          <p className="lead">Acesse com suas credenciais institucionais.</p>

          <form className="stack" onSubmit={handleSubmit}>
            <div className="field">
              <label>E-mail</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label>Senha</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            <button className="btn primary" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: '9px 12px', marginTop: 8 }}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 8, fontSize: 11.5, color: 'var(--ink-3)' }}>
              <Lock size={12} /> Conexão criptografada · TLS 1.3
            </div>
          </form>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'center' }}>
            Problemas para entrar? Contate <a href="mailto:ti@aeroclube.rc.br" style={{ color: 'var(--accent-ink)' }}>ti@aeroclube.rc.br</a>
          </div>
        </div>
      </div>
    </div>
  );
}
