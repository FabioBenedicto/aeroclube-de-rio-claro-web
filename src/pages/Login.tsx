import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { login as apiLogin } from '../api/auth';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-bg-sunk p-6">
<div className="w-full max-w-[380px] bg-bg-elev border border-line rounded-[12px] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="text-[14px] font-semibold tracking-[-0.01em] leading-tight">Aeroclube de Rio Claro</div>
              <div className="text-[11px] text-ink-3 uppercase tracking-[0.05em] mt-px">Sistema Financeiro</div>
            </div>
          </div>
        </div>

        <div className="px-8 pt-7 pb-8">
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold tracking-[-0.015em] m-0 mb-1">Entrar na sua conta</h2>
            <p className="text-[13px] text-ink-3 m-0">Acesse com suas credenciais institucionais.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">E-mail</label>
              <input
                className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Senha</label>
              <div className="relative">
                <input
                  className="w-full px-2.5 py-[7px] pr-10 border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-ink-3 flex items-center p-0.5 hover:text-ink"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <div className="text-[13px] text-danger">{error}</div>}
            <button
              className="inline-flex items-center justify-center gap-1.5 px-3 py-[9px] rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 mt-1 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
