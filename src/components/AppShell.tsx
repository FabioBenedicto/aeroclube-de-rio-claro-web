import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, ArrowDownLeft, ArrowUpRight, FileText, Plane, Radar,
  Users, Building2, Settings, LogOut, UserCog, Pencil, BarChart2, Landmark,
} from 'lucide-react';
import { cn } from '../utils/cn';
import Toaster from './Toaster';
import { PERM } from '../utils/permissions';

const NAV = [
  { group: 'Financial', items: [
    { path: '/dashboard',   label: 'Dashboard',   Icon: Home },
    { path: '/receivables', label: 'Receivables', Icon: ArrowDownLeft, permission: PERM.RECEIVABLES.VIEW },
    { path: '/payables',    label: 'Payables',    Icon: ArrowUpRight,  permission: PERM.PAYABLES.VIEW },
    { path: '/invoices',    label: 'Invoices',    Icon: FileText,      permission: PERM.INVOICES.VIEW },
    { path: '/cnab',        label: 'CNAB',        Icon: Landmark,      adminOnly: true },
  ]},
  { group: 'Operations', items: [
    { path: '/flights',   label: 'Flights',   Icon: Plane,     permission: PERM.FLIGHTS.VIEW },
    { path: '/planes',    label: 'Aircraft',  Icon: Radar,     permission: PERM.PLANES.VIEW },
    { path: '/peoples',   label: 'People',    Icon: Users,     permission: PERM.CUSTOMERS.VIEW },
    { path: '/companies', label: 'Companies', Icon: Building2, permission: PERM.COMPANIES.VIEW },
  ]},
  { group: 'Analytics', items: [
    { path: '/reports', label: 'Reports', Icon: BarChart2, permission: PERM.REPORTS.VIEW },
  ]},
  { group: 'System', items: [
    { path: '/settings', label: 'Settings', Icon: Settings, adminOnly: true },
    { path: '/users',    label: 'Users',    Icon: UserCog,  adminOnly: true },
  ]},
];

const CRUMB_MAP: Record<string, string[]> = {
  '/dashboard':   ['Aeroclube', 'Financial',  'Dashboard'],
  '/receivables': ['Aeroclube', 'Financial',  'Receivables'],
  '/payables':    ['Aeroclube', 'Financial',  'Payables'],
  '/invoices':    ['Aeroclube', 'Financial',  'Invoices'],
  '/cnab':        ['Aeroclube', 'Financial',  'CNAB'],
  '/flights':     ['Aeroclube', 'Operations', 'Flights'],
  '/planes':      ['Aeroclube', 'Operations', 'Aircraft'],
  '/peoples':     ['Aeroclube', 'Operations', 'People'],
  '/companies':   ['Aeroclube', 'Operations', 'Companies'],
  '/reports':     ['Aeroclube', 'Analytics',  'Reports'],
  '/settings':    ['Aeroclube', 'Settings'],
  '/users':       ['Aeroclube', 'System',     'Users'],
  '/profile':     ['Aeroclube', 'My Profile'],
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
      <aside className="bg-bg-elev border-r border-line flex flex-col sticky top-0 h-screen overflow-hidden">
        <div className="flex items-center gap-2.5 px-[18px] py-[18px] pb-4 border-b border-line">
          <div>
            <div className="font-semibold text-[13px] tracking-tight leading-tight">Aeroclube de Rio&nbsp;Claro</div>
            <div className="text-[10.5px] text-ink-3 tracking-[0.04em] uppercase mt-0.5">Financial System</div>
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
                {user?.role === 'ADMIN' ? 'Admin' : 'Employee'}
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
              title="My profile"
              onClick={() => navigate('/profile')}
            >
              <Pencil size={13} />
            </button>
            <button
              className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
              title="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-col min-w-0">
        <div
          className="flex items-center gap-3 px-6 py-3 border-b border-line sticky top-0 z-[5] min-h-[52px]"
          style={{ background: 'color-mix(in oklch, var(--bg-elev), transparent 5%)', backdropFilter: 'blur(8px)' }}
        >
          <nav className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">/</span>}
                {i === crumbs.length - 1
                  ? <strong className="text-ink font-medium">{c}</strong>
                  : <span>{c}</span>}
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
