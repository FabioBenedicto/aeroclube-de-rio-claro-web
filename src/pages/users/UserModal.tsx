import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, User, ShieldCheck } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createUser, updateUser } from '../../api/users';
import type { UserRecord } from '../../api/users';
import { getPermissions } from '../../api/permissions';
import { toast } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

interface Props {
  mode: 'new' | 'edit';
  user?: UserRecord;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPLOYEE_STEPS = ['Tipo', 'Dados', 'Permissões'] as const;
const ADMIN_STEPS    = ['Tipo', 'Dados'] as const;

export default function UserModal({ mode, user, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<'ADMIN' | 'USER'>(user?.role ?? 'USER');
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [perms, setPerms] = useState<Set<string>>(new Set(user?.permissions ?? []));

  const { data: permGroups = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
    staleTime: Infinity,
  });

  function togglePerm(p: string) {
    if (!p) return;
    setPerms(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
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
    <Modal onClose={onClose} maxWidth={560}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-line gap-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[15px] font-semibold text-ink">{mode === 'new' ? 'Novo usuário' : 'Editar usuário'}</span>
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
          <div className="grid grid-cols-2 gap-4">
            {([
              { value: 'USER', label: 'Usuário', sub: 'Acesso por permissões', Icon: User },
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

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Nome</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">E-mail</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Senha</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'new' ? 'Mínimo 6 caracteres' : '••••••'} />
            </div>
          </div>
        )}

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
                  {permGroups.map(group => {
                    const byAction = Object.fromEntries(group.actions.map(a => [a.action, a.key]));
                    const view   = byAction['view'];
                    const create = byAction['create'];
                    const update = byAction['update'];
                    const del    = byAction['delete'];
                    const all    = [view, create, update, del].filter(Boolean) as string[];
                    const allChecked = all.length > 0 && all.every(p => perms.has(p));
                    const toggleRow = () => setPerms(prev => {
                      const n = new Set(prev);
                      allChecked ? all.forEach(p => n.delete(p)) : all.forEach(p => n.add(p));
                      return n;
                    });
                    return (
                      <tr key={group.module} className="border-b border-line last:border-0 hover:bg-bg-hover">
                        <td className="px-3 py-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox checked={allChecked} onChange={toggleRow} />
                            {group.module_label}
                          </label>
                        </td>
                        {[view, create, update, del].map((p, i) => (
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
      </Modal.Body>

      <Modal.Footer justify="between">
        <div>
          {step > 1 && (
            <Button variant="default" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}>
              <ChevronLeft size={14} /> Voltar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step === 1 && (
            <Button variant="default" onClick={onClose}>Cancelar</Button>
          )}
          <Button variant="primary" onClick={nextStep} disabled={mutation.isPending}>
            {isLastStep
              ? <><Check size={14} /> {mutation.isPending ? 'Salvando…' : mode === 'new' ? 'Cadastrar' : 'Salvar'}</>
              : <>Próximo <ChevronRight size={14} /></>}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
