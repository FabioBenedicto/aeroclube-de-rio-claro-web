import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sun, Moon, Monitor, Check, Lock, Trash2 } from 'lucide-react';
import { updateMe, deleteMe } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../utils/toast';
import type { UserRecord } from '../api/users';

type Tab = 'info' | 'senha' | 'aparencia' | 'conta';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',      label: 'Informações'  },
  { id: 'senha',     label: 'Senha'        },
  { id: 'aparencia', label: 'Aparência'    },
  { id: 'conta',     label: 'Conta'        },
];

const inp     = 'w-full px-3 py-2 rounded-md border border-line bg-bg text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] transition-[border-color,box-shadow] duration-100';
const inpLock = 'w-full px-3 py-2 rounded-md border border-line bg-bg-sunk text-[13px] text-ink-3 outline-none cursor-not-allowed select-none';
const errCls  = 'text-[11.5px] text-danger mt-0.5';
const saveBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-50';

export default function Profile() {
  const { user, updateLoggedUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [tab, setTab] = useState<Tab>('info');
  const [name, setName] = useState(user?.name ?? '');
  const [pass, setPass] = useState({ current: '', next: '', confirm: '' });
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const infoMut = useMutation({
    mutationFn: updateMe,
    onSuccess: (data: UserRecord) => {
      updateLoggedUser(data as any);
      toast.success('Perfil atualizado.');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteMe,
    onSuccess: () => { logout(); },
  });

  const passMut = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      setPass({ current: '', next: '', confirm: '' });
      toast.success('Senha alterada.');
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      if (msg === 'Senha atual incorreta') setPassErrors({ current: 'Senha atual incorreta' });
    },
  });

  function saveInfo() {
    if (!name.trim()) return toast.error('Nome é obrigatório.');
    infoMut.mutate({ name: name.trim() });
  }

  function savePass() {
    const errs: Record<string, string> = {};
    if (!pass.current) errs.current = 'Informe a senha atual';
    if (!pass.next)    errs.next    = 'Informe a nova senha';
    else if (pass.next.length < 6) errs.next = 'Mínimo 6 caracteres';
    if (pass.next && pass.next !== pass.confirm) errs.confirm = 'Senhas não coincidem';
    if (Object.keys(errs).length) { setPassErrors(errs); return; }
    setPassErrors({});
    passMut.mutate({ currentPassword: pass.current, password: pass.next });
  }

  return (
    <div className="flex flex-col gap-5 max-w-[520px]">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Meu perfil</h1>
        <p className="text-[13px] text-ink-3 mt-1 m-0">Gerencie suas informações e preferências</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2 text-[13px] font-medium border-0 bg-transparent cursor-pointer transition-colors whitespace-nowrap',
              tab === t.id
                ? 'text-ink border-b-2 border-accent -mb-px'
                : 'text-ink-3 hover:text-ink',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Informações */}
      {tab === 'info' && (
        <div className="bg-bg-elev border border-line rounded-lg p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Nome</label>
              <input className={inp} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-ink-2">E-mail</label>
                <span className="flex items-center gap-1 text-[11px] text-ink-4">
                  <Lock size={10} /> Não editável
                </span>
              </div>
              <input className={inpLock} value={user?.email ?? ''} readOnly tabIndex={-1} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Papel</label>
              <input className={inpLock} value={user?.role === 'ADMIN' ? 'Administrador' : 'Funcionário'} readOnly tabIndex={-1} />
            </div>
          </div>
          <div className="flex justify-end">
            <button className={saveBtn} onClick={saveInfo} disabled={infoMut.isPending}>
              <Check size={14} /> {infoMut.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Senha */}
      {tab === 'senha' && (
        <div className="bg-bg-elev border border-line rounded-lg p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Senha atual</label>
              <input
                className={inp}
                type="password"
                value={pass.current}
                onChange={e => { setPass(p => ({ ...p, current: e.target.value })); setPassErrors({}); }}
              />
              {passErrors.current && <span className={errCls}>{passErrors.current}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Nova senha</label>
              <input
                className={inp}
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={pass.next}
                onChange={e => setPass(p => ({ ...p, next: e.target.value }))}
              />
              {passErrors.next && <span className={errCls}>{passErrors.next}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Confirmar nova senha</label>
              <input
                className={inp}
                type="password"
                value={pass.confirm}
                onChange={e => setPass(p => ({ ...p, confirm: e.target.value }))}
              />
              {passErrors.confirm && <span className={errCls}>{passErrors.confirm}</span>}
            </div>
          </div>
          <div className="flex justify-end">
            <button className={saveBtn} onClick={savePass} disabled={passMut.isPending}>
              <Check size={14} /> {passMut.isPending ? 'Salvando…' : 'Alterar senha'}
            </button>
          </div>
        </div>
      )}

      {/* Conta */}
      {tab === 'conta' && (
        <div className="bg-bg-elev border border-danger/30 rounded-lg p-5 flex flex-col gap-4">
          <div>
            <div className="text-[13px] font-medium text-ink mb-1">Excluir conta</div>
            <p className="text-[12px] text-ink-3 m-0">Esta ação é permanente e não pode ser desfeita. Todos os seus dados de acesso serão removidos.</p>
          </div>
          {!confirmDelete ? (
            <div>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-danger text-danger cursor-pointer hover:bg-danger-soft bg-transparent"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} /> Excluir minha conta
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-danger font-medium m-0">Tem certeza? Esta ação não pode ser desfeita.</p>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-danger border border-danger text-white cursor-pointer hover:opacity-90 disabled:opacity-60"
                  disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate()}
                >
                  <Trash2 size={14} /> {deleteMut.isPending ? 'Excluindo…' : 'Confirmar exclusão'}
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aparência */}
      {tab === 'aparencia' && (
        <div className="bg-bg-elev border border-line rounded-lg p-5 flex flex-col gap-4">
          <p className="text-[12px] text-ink-3 m-0">Escolha o tema da interface.</p>
          <div className="flex gap-3">
            {([
              { value: 'light',  label: 'Claro',            Icon: Sun     },
              { value: 'dark',   label: 'Escuro',           Icon: Moon    },
              { value: 'system', label: 'Padrão do sistema', Icon: Monitor },
            ] as const).map(({ value, label, Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  className={`flex-1 flex flex-col items-center gap-2.5 py-6 px-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    active ? 'border-accent bg-accent-soft' : 'border-line bg-bg hover:bg-bg-hover'
                  }`}
                  onClick={() => setTheme(value)}
                >
                  <Icon size={22} className={active ? 'text-accent' : 'text-ink-3'} />
                  <span className={`text-[13px] font-medium text-center ${active ? 'text-accent-ink' : 'text-ink-2'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
