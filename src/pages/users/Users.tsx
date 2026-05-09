import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit } from 'lucide-react';
import { getUsers, deleteUser } from '../../api/users';
import type { UserRecord } from '../../api/users';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import UserModal from './UserModal';

type MenuState = { id: number; top: number; right: number };

export default function Users() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; user?: UserRecord } | null>(null);

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const menuUser = menuState ? users.find((u) => u.id === menuState.id) ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Usuários</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Contas de acesso ao sistema</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90"
          onClick={() => setModal({ mode: 'new' })}
        >
          <Plus size={14} /> Novo usuário
        </button>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-8 text-center text-[13px] text-ink-3">Carregando…</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Nome</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">E-mail</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Papel</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Criado em</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-bg-hover transition-colors duration-75">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 text-ink-2">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${u.role === 'ADMIN' ? 'bg-accent-soft text-accent-ink' : 'bg-bg-sunk text-ink-2'}`}>
                      {u.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-3">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      className="inline-flex items-center justify-center w-6 h-6 rounded border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
                      onClick={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setMenuState({ id: u.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                      }}
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-3">Nenhum usuário cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {menuState && menuUser && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setModal({ mode: 'edit', user: menuUser })}>
            <Edit size={14} /> Editar
          </button>
          <RowMenuSep />
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuUser.id)}>
            <Trash2 size={14} /> Excluir
          </button>
        </RowMenu>
      )}

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['users'] }); setModal(null); }}
        />
      )}
    </div>
  );
}
