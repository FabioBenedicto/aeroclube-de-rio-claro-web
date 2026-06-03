import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit } from 'lucide-react';
import { getUsers, deleteUser } from '../../api/users';
import type { UserRecord } from '../../api/users';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import UserModal from './UserModal';
import DateInput from '../../components/DateInput';
import Pagination from '../../components/Pagination';
import { toast, extractErrorMessage } from '../../utils/toast';

type MenuState = { id: number; top: number; right: number };

const PAGE_SIZE = 20;

export default function Users() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; user?: UserRecord } | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, dateFrom, dateTo]);

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuUser = menuState ? users.find((u) => u.id === menuState.id) ?? null : null;

  const filtered = users.filter(u => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (dateFrom || dateTo) {
      const d = new Date(u.created_at);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); if (d > end) return false; }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3 justify-end">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Criação</span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
            <DateInput value={pendingFrom} onChange={setPendingFrom} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Até</span>
            <DateInput value={pendingTo} onChange={setPendingTo} />
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</button>
        </div>

        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line justify-end">
            <div className="relative flex items-center">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[260px]"
                placeholder="Buscar por nome ou e-mail"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-[13px] text-ink-3">Carregando…</div>
          ) : (
            <>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Nome</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">E-mail</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Papel</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Criado em</th>
                    <th className="w-10 bg-bg border-b border-line" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
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
                        {u.role !== 'ADMIN' && (
                          <button
                            className="inline-flex items-center justify-center w-6 h-6 rounded border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuState(s => s?.id === u.id ? null : { id: u.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }}
                          >
                            ⋯
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-3">Nenhum usuário encontrado.</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} total={filtered.length} limit={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {menuState && menuUser && menuUser.role !== 'ADMIN' && (
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
