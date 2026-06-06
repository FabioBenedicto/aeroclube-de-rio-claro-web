import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { updateMe } from '../api/users';
import { toast } from '../utils/toast';
import Button from './ui/Button';
import Input from './ui/Input';

interface Props {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: Props) {
  const [form, setForm] = useState({ currentPassword: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      toast.success('Senha alterada');
      onClose();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      if (msg === 'Senha atual incorreta') {
        setErrors(e => ({ ...e, currentPassword: 'Senha atual incorreta' }));
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = 'Informe a senha atual';
    if (!form.password) errs.password = 'Informe a nova senha';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (form.password && form.password !== form.confirmPassword) errs.confirmPassword = 'Senhas não coincidem';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mut.mutate({ currentPassword: form.currentPassword, password: form.password });
  }

  const errCls = 'text-[11.5px] text-danger mt-0.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-bg-elev border border-line rounded-xl shadow-2xl w-full max-w-[380px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-[15px] font-semibold">Alterar senha</h2>
          <Button variant="icon" onClick={onClose}><X size={16} /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-ink-2">Senha atual</label>
            <Input type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} />
            {errors.currentPassword && <span className={errCls}>{errors.currentPassword}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-ink-2">Nova senha</label>
            <Input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            {errors.password && <span className={errCls}>{errors.password}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-ink-2">Confirmar nova senha</label>
            <Input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            {errors.confirmPassword && <span className={errCls}>{errors.confirmPassword}</span>}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="default" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={mut.isPending}>
              {mut.isPending ? 'Salvando…' : 'Alterar senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
