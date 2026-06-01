import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, ArrowDownLeft, ArrowUpRight, FileText, Plane, Radar, Users, Building2, Settings, LogOut, UserCog, Pencil, BarChart2, Landmark } from 'lucide-react';
import { cn } from '../utils/cn';
import Toaster from './Toaster';
import { PERM } from '../utils/permissions';

const NAV = [
  { group: 'Financeiro', items: [
    { path: '/dashboard',   label: 'Dashboard',        Icon: Home },
    { path: '/receivables', label: 'Títulos a receber', Icon: ArrowDownLeft,  permission: PERM.RECEIVABLES.VIEW },
    { path: '/payables',    label: 'Títulos a pagar',   Icon: ArrowUpRight,   permission: PERM.PAYABLES.VIEW },
    { path: '/invoices',    label: 'Faturas',          Icon: FileText,       permission: PERM.INVOICES.VIEW },
    { path: '/cnab',        label: 'CNAB',             Icon: Landmark,       adminOnly: true },
  ]},
  { group: 'Operação', items: [
    { path: '/flights',   label: 'Voos',       Icon: Plane,      permission: PERM.FLIGHTS.VIEW },
    { path: '/planes',    label: 'Aeronaves',  Icon: Radar,      permission: PERM.PLANES.VIEW },
    { path: '/pessoas',   label: 'Pessoas',    Icon: Users,      permission: PERM.CUSTOMERS.VIEW },
    { path: '/companies', label: 'Empresas',   Icon: Building2,  permission: PERM.COMPANIES.VIEW },
  ]},
  { group: 'Análise', items: [
    { path: '/reports', label: 'Relatórios', Icon: BarChart2, permission: PERM.REPORTS.VIEW },
  ]},
  { group: 'Sistema', items: [
    { path: '/settings',  label: 'Configurações', Icon: Settings, adminOnly: true },
    { path: '/usuarios',  label: 'Usuários',      Icon: UserCog,  adminOnly: true },
  ]},
];

const CRUMB_MAP: Record<string, string[]> = {
  '/dashboard':   ['Aeroclube', 'Financeiro', 'Dashboard'],
  '/receivables': ['Aeroclube', 'Financeiro', 'Títulos a receber'],
  '/payables':    ['Aeroclube', 'Financeiro', 'Títulos a pagar'],
  '/invoices':    ['Aeroclube', 'Financeiro', 'Faturas'],
  '/cnab':        ['Aeroclube', 'Financeiro', 'CNAB'],
  '/flights':     ['Aeroclube', 'Operação', 'Voos'],
  '/reports':     ['Aeroclube', 'Análise', 'Relatórios'],
  '/planes':      ['Aeroclube', 'Operação', 'Aeronaves'],
  '/pessoas':     ['Aeroclube', 'Operação', 'Pessoas'],
  '/companies':   ['Aeroclube', 'Operação', 'Empresas'],
  '/settings':    ['Aeroclube', 'Configurações'],
  '/usuarios':    ['Aeroclube', 'Sistema', 'Usuários'],
  '/perfil':      ['Aeroclube', 'Meu perfil'],
};

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, can } = useAuth();

  const crumbs = Object.entries(CRUMB_MAP).find(([k]) => location.pathname.startsWith(k))?.[1] ?? ['Aeroclube'];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '??';

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '232px 1fr' }}>
      {/* Sidebar */}
      <aside className="bg-bg-elev border-r border-line flex flex-col sticky top-0 h-screen overflow-hidden">
        <div className="flex items-center gap-2.5 px-[18px] py-[18px] pb-4 border-b border-line">
          <div>
            <div className="font-semibold text-[13px] tracking-tight leading-tight">Aeroclube de Rio&nbsp;Claro</div>
            <div className="text-[10.5px] text-ink-3 tracking-[0.04em] uppercase mt-0.5">Sistema Financeiro</div>
          </div>
        </div>

        <nav className="flex flex-col py-0.5 px-2 gap-px flex-1 overflow-y-auto">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="px-2.5 pt-3.5 pb-1 text-[10px] tracking-[0.1em] uppercase text-ink-4 font-semibold">
                {group.group}
              </div>
              {group.items
                .filter(it => {
                  if ('adminOnly' in it && it.adminOnly) return user?.role === 'ADMIN';
                  if ('permission' in it && it.permission) return can(it.permission as string);
                  return true;
                })
                .map(({ path, label, Icon }) => (
                  <button
                    key={path}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-[7px] rounded-[5px] text-[13px] border-0 w-full text-left cursor-pointer transition-[background,color] duration-[80ms]',
                      location.pathname.startsWith(path)
                        ? 'bg-accent-soft text-accent-ink font-medium'
                        : 'bg-transparent text-ink-2 hover:bg-bg-hover hover:text-ink',
                    )}
                    onClick={() => navigate(path)}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 p-2 rounded-md bg-bg-sunk">
            <div className="w-7 h-7 rounded-full bg-accent-soft text-accent-ink grid place-items-center font-semibold text-[11px] shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">{user?.name}</div>
              <div className="text-[10.5px] text-ink-3 uppercase tracking-[0.02em]">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
              title="Meu perfil"
              onClick={() => navigate('/perfil')}
            >
              <Pencil size={13} />
            </button>
            <button
              className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
              title="Sair"
              onClick={handleLogout}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-line sticky top-0 z-[5] min-h-[52px]"
          style={{ background: 'color-mix(in oklch, var(--bg-elev), transparent 5%)', backdropFilter: 'blur(8px)' }}>
          <nav className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">/</span>}
                {i === crumbs.length - 1 ? <strong className="text-ink font-medium">{c}</strong> : <span>{c}</span>}
              </span>
            ))}
          </nav>
        </div>
        <div className="p-6 pb-16 max-w-[1440px] w-full" style={{ paddingLeft: 28, paddingRight: 28 }}>
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
