import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Home, ArrowDownLeft, ArrowUpRight, FileText, Plane, Radar, Users, Settings, LogOut, Sun, Moon } from 'lucide-react';

const NAV = [
  { group: 'Financeiro', items: [
    { path: '/dashboard',   label: 'Dashboard',        Icon: Home },
    { path: '/receivables', label: 'Contas a receber', Icon: ArrowDownLeft },
    { path: '/payables',    label: 'Contas a pagar',   Icon: ArrowUpRight },
    { path: '/invoices',    label: 'Faturas',          Icon: FileText },
  ]},
  { group: 'Operação', items: [
    { path: '/flights',   label: 'Voos',       Icon: Plane },
    { path: '/planes',    label: 'Aeronaves',  Icon: Radar },
    { path: '/customers', label: 'Clientes',   Icon: Users },
  ]},
  { group: 'Sistema', items: [
    { path: '/settings', label: 'Configurações', Icon: Settings, adminOnly: true },
  ]},
];

const CRUMB_MAP: Record<string, string[]> = {
  '/dashboard':   ['Aeroclube', 'Financeiro', 'Dashboard'],
  '/receivables': ['Aeroclube', 'Financeiro', 'Contas a receber'],
  '/payables':    ['Aeroclube', 'Financeiro', 'Contas a pagar'],
  '/invoices':    ['Aeroclube', 'Financeiro', 'Faturas'],
  '/flights':     ['Aeroclube', 'Operação', 'Voos'],
  '/planes':      ['Aeroclube', 'Operação', 'Aeronaves'],
  '/customers':   ['Aeroclube', 'Operação', 'Clientes'],
  '/settings':    ['Aeroclube', 'Configurações'],
};

function BrandMark() {
  return (
    <div className="brand-mark">
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5v17M3.5 12h17" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const crumbs = Object.entries(CRUMB_MAP).find(([k]) => location.pathname.startsWith(k))?.[1] ?? ['Aeroclube'];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '??';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <div>
            <div className="brand-title">Aeroclube de Rio&nbsp;Claro</div>
            <div className="brand-sub">Financeiro · v1.0</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="nav-section">{group.group}</div>
              {group.items
                .filter(it => !('adminOnly' in it) || user?.role === 'ADMIN')
                .map(({ path, label, Icon }) => (
                  <button
                    key={path}
                    className={`nav-item ${location.pathname.startsWith(path) ? 'active' : ''}`}
                    onClick={() => navigate(path)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {user?.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}
              </div>
            </div>
            <button className="icon-btn" title="Sair" onClick={handleLogout}><LogOut size={14} /></button>
          </div>
          <div className="theme-toggle">
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={13} /> Claro</button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={13} /> Escuro</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <nav className="breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span className="sep">/</span>}
                {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
              </span>
            ))}
          </nav>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
