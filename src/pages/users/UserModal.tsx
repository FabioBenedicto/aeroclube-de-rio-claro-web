import { useState } from 'react';
import { X, Check } from 'lucide-react';
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

const MODULES = [
  { label: 'Títulos a receber', view: 'receivables:view', create: 'receivables:create', update: 'receivables:update', delete: 'receivables:delete' },
  { label: 'Títulos a pagar',   view: 'payables:view',    create: 'payables:create',    update: 'payables:update',    delete: 'payables:delete'    },
  { label: 'Faturas',          view: 'invoices:view',    create: 'invoices:create',    update: 'invoices:update',    delete: 'invoices:delete'    },
  { label: 'Voos',             view: 'flights:view',     create: 'flights:create',     update: 'flights:update',     delete: 'flights:delete'     },
  { label: 'Aeronaves',        view: 'planes:view',      create: 'planes:create',      update: 'planes:update',      delete: 'planes:delete'      },
  { label: 'Pessoas',          view: 'customers:view',   create: 'customers:create',   update: 'customers:update',   delete: 'customers:delete'   },
  { label: 'Empresas',         view: 'companies:view',   create: 'companies:create',   update: 'companies:update',   delete: 'companies:delete'   },
  { label: 'Relatórios',       view: 'reports:view',     create: '',                   update: '',                   delete: ''                   },
];

export default function UserModal({ mode, user, onClose, onSuccess }: Props) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EMPLOYEE'>(user?.role ?? 'EMPLOYEE');
  const [perms, setPerms] = useState<Set<string>>(new Set(user?.permissions ?? []));

  function togglePerm(p: string) {
    setPerms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  function toggleRow(mod: typeof MODULES[0]) {
    const all = [mod.view, mod.create, mod.update, mod.delete];
    const allChecked = all.every((p) => perms.has(p));
    setPerms((prev) => {
      const next = new Set(prev);
      allChecked ? all.forEach((p) => next.delete(p)) : all.forEach((p) => next.add(p));
      return next;
    });
  }

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createUser>[0]) =>
      mode === 'new' ? createUser(data) : updateUser(user!.id, data),
    onSuccess: () => { toast.success(mode === 'new' ? 'Usuário criado.' : 'Usuário atualizado.'); onSuccess(); },
  });

  function handleSave() {
    if (!name.trim() || !email.trim()) return toast.error('Nome e e-mail são obrigatórios.');
    if (mode === 'new' && !password) return toast.error('Senha é obrigatória.');

    const payload: Parameters<typeof createUser>[0] = {
      name: name.trim(),
      email: email.trim(),
      role,
      permissions: role === 'ADMIN' ? [] : Array.from(perms),
    };
    if (password) payload.password = password;

    mutation.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[560px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <h3 className="text-[15px] font-semibold m-0">{mode === 'new' ? 'Novo usuário' : 'Editar usuário'}</h3>
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Nome</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">E-mail</label>
              <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">
                Senha {mode === 'edit' && <span className="text-ink-3 font-normal">(vazio = não alterar)</span>}
              </label>
              <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Papel</label>
              <select
                className={inputCls}
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'EMPLOYEE')}
              >
                <option value="EMPLOYEE">Funcionário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          {role === 'EMPLOYEE' && (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Permissões</div>
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
                    {MODULES.map((mod) => {
                      const all = [mod.view, mod.create, mod.update, mod.delete];
                      const allChecked = all.every((p) => perms.has(p));
                      return (
                        <tr key={mod.label} className="border-b border-line last:border-0 hover:bg-bg-hover">
                          <td className="px-3 py-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <Checkbox
                                checked={allChecked}
                                onChange={() => toggleRow(mod)}
                              />
                              {mod.label}
                            </label>
                          </td>
                          {[mod.view, mod.create, mod.update, mod.delete].map((p) => (
                            <td key={p} className="text-center px-2 py-2">
                              <Checkbox
                                checked={perms.has(p)}
                                onChange={() => togglePerm(p)}
                              />
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

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line flex-shrink-0">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-50"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            <Check size={14} /> {mode === 'new' ? 'Cadastrar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
