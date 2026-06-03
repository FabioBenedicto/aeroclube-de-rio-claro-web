import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, User, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { createUser, updateUser } from '../../api/users';
import type { UserRecord } from '../../api/users';
import { toast } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';

interface Props {
  mode: 'new' | 'edit';
  user?: UserRecord;
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls = 'w-full px-3 py-1.5 text-[13px] bg-bg border border-line rounded-md text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100 placeholder:text-ink-3';
const btnCancel = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-50';

const MODULES = [
  { label: 'Títulos a receber', view: 'receivables:view', create: 'receivables:create', update: 'receivables:update', delete: 'receivables:delete' },
  { label: 'Títulos a pagar',   view: 'payables:view',    create: 'payables:create',    update: 'payables:update',    delete: 'payables:delete'    },
  { label: 'Faturas',           view: 'invoices:view',    create: 'invoices:create',    update: 'invoices:update',    delete: 'invoices:delete'    },
  { label: 'Voos',              view: 'flights:view',     create: 'flights:create',     update: 'flights:update',     delete: 'flights:delete'     },
  { label: 'Aeronaves',         view: 'planes:view',      create: 'planes:create',      update: 'planes:update',      delete: 'planes:delete'      },
  { label: 'Pessoas',           view: 'customers:view',   create: 'customers:create',   update: 'customers:update',   delete: 'customers:delete'   },
  { label: 'Empresas',          view: 'companies:view',   create: 'companies:create',   update: 'companies:update',   delete: 'companies:delete'   },
  { label: 'Relatórios',        view: 'reports:view',     create: '',                   update: '',                   delete: ''                   },
];

const EMPLOYEE_STEPS = ['Tipo', 'Dados', 'Permissões'] as const;
const ADMIN_STEPS    = ['Tipo', 'Dados'] as const;

export default function UserModal({ mode, user, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<'ADMIN' | 'EMPLOYEE'>(user?.role ?? 'EMPLOYEE');
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [perms, setPerms] = useState<Set<string>>(new Set(user?.permissions ?? []));

  function togglePerm(p: string) {
    if (!p) return;
    setPerms(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  }

  function toggleRow(mod: typeof MODULES[0]) {
    const all = [mod.view, mod.create, mod.update, mod.delete].filter(Boolean);
    const allChecked = all.every(p => perms.has(p));
    setPerms(prev => {
      const n = new Set(prev);
      allChecked ? all.forEach(p => n.delete(p)) : all.forEach(p => n.add(p));
      return n;
    });
  }

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createUser>[0]) =>
      mode === 'new' ? createUser(data) : updateUser(user!.id, data),
    onSuccess: () => { toast.success(mode === 'new' ? 'Usuário criado.' : 'Usuário atualizado.'); onSuccess(); },
  });

  const isLastStep = step === 3 || (step === 2 && role === 'ADMIN');

  function handleSave() {
    const payload: Parameters<typeof createUser>[0] = {
      name: name.trim(),
      email: email.trim(),
      role,
      permissions: role === 'ADMIN' ? [] : Array.from(perms),
    };
    if (password) payload.password = password;
    mutation.mutate(payload);
  }

  function nextStep() {
    if (step === 2) {
      if (!name.trim() || !email.trim()) { toast.error('Nome e e-mail são obrigatórios.'); return; }
      if (mode === 'new' && !password) { toast.error('Senha é obrigatória.'); return; }
    }
    if (isLastStep) { handleSave(); return; }
    setStep(s => (s + 1) as 1 | 2 | 3);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[560px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="text-[15px] font-semibold m-0">{mode === 'new' ? 'Novo usuário' : 'Editar usuário'}</h3>
            <div className="flex items-center gap-1.5">
              {(role === 'ADMIN' ? ADMIN_STEPS : EMPLOYEE_STEPS).map((label, i) => {
                const n = (i + 1) as 1 | 2 | 3;
                return (
                  <span key={n} className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${
                      step === n ? 'bg-accent text-white' : step > n ? 'bg-success text-white' : 'bg-bg-sunk text-ink-3'
                    }`}>{n}</span>
                    <span className={`text-[11px] ${step === n ? 'text-ink font-medium' : 'text-ink-3'}`}>{label}</span>
                    {i < 2 && <ChevronRight size={12} className="text-ink-4" />}
                  </span>
                );
              })}
            </div>
          </div>
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto flex-1">

          {/* Step 1 — Tipo */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {([
                { value: 'EMPLOYEE', label: 'Funcionário', sub: 'Acesso por permissões', Icon: User },
                { value: 'ADMIN',    label: 'Administrador', sub: 'Acesso total ao sistema', Icon: ShieldCheck },
              ] as const).map(({ value, label, sub, Icon }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    className={`flex flex-col items-center gap-3 py-8 px-4 rounded-lg border-2 cursor-pointer transition-colors text-left ${
                      active ? 'border-accent bg-accent-soft' : 'border-line bg-bg hover:bg-bg-hover'
                    }`}
                    onClick={() => setRole(value)}
                  >
                    <Icon size={28} className={active ? 'text-accent' : 'text-ink-3'} />
                    <div className="text-center">
                      <div className={`text-[13px] font-semibold ${active ? 'text-accent-ink' : 'text-ink'}`}>{label}</div>
                      <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2 — Dados */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Nome</label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">E-mail</label>
                <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Senha</label>
                <input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'new' ? 'Mínimo 6 caracteres' : '••••••'} />
              </div>
            </div>
          )}

          {/* Step 3 — Permissões (EMPLOYEE only) */}
          {step === 3 && (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-1">Permissões do funcionário</div>
              <div className="border border-line rounded-md overflow-hidden">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-line bg-bg-sunk">
                      <th className="text-left px-3 py-2 font-medium text-ink-2 w-[40%]">Módulo</th>
                      <th className="text-center px-2 py-2 font-medium text-ink-2">Visualizar</th>
                      <th className="text-center px-2 py-2 font-medium text-ink-2">Criar</th>
                      <th className="text-center px-2 py-2 font-medium text-ink-2">Editar</th>
                      <th className="text-center px-2 py-2 font-medium text-ink-2">Excluir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(mod => {
                      const all = [mod.view, mod.create, mod.update, mod.delete].filter(Boolean);
                      const allChecked = all.length > 0 && all.every(p => perms.has(p));
                      return (
                        <tr key={mod.label} className="border-b border-line last:border-0 hover:bg-bg-hover">
                          <td className="px-3 py-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <Checkbox checked={allChecked} onChange={() => toggleRow(mod)} />
                              {mod.label}
                            </label>
                          </td>
                          {[mod.view, mod.create, mod.update, mod.delete].map((p, i) => (
                            <td key={i} className="text-center px-2 py-2">
                              {p ? <Checkbox checked={perms.has(p)} onChange={() => togglePerm(p)} /> : <span className="text-ink-4">—</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-line flex-shrink-0">
          <div>
            {step > 1 && (
              <button className={btnCancel} onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}>
                <ChevronLeft size={14} /> Voltar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 1 && (
              <button className={btnCancel} onClick={onClose}>Cancelar</button>
            )}
            <button className={btnPrimary} onClick={nextStep} disabled={mutation.isPending}>
              {isLastStep
                ? <><Check size={14} /> {mutation.isPending ? 'Salvando…' : mode === 'new' ? 'Cadastrar' : 'Salvar'}</>
                : <>Próximo <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
