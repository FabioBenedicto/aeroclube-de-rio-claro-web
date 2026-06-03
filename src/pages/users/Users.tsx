import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { getUsers, deleteUser } from '../../api/users';
import type { UserRecord } from '../../api/users';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import UserModal from './UserModal';
import DateInput from '../../components/DateInput';
import Pagination from '../../components/Pagination';
import Badge from '../../components/ui/Badge';
import { toast, extractErrorMessage } from '../../utils/toast';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

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

  const columns: TableColumn<UserRecord>[] = [
    {
      key: 'id',
      label: 'ID',
      render: row => <span className="font-mono text-[11.5px]">{row.id}</span>,
    },
    {
      key: 'name',
      label: 'Nome',
      render: row => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'email',
      label: 'E-mail',
      render: row => <span className="text-ink-2">{row.email}</span>,
    },
    {
      key: 'role',
      label: 'Papel',
      render: row => (
        <Badge variant={row.role === 'ADMIN' ? 'accent' : 'default'}>
          {row.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: row => <span className="text-ink-3">{new Date(row.created_at).toLocaleDateString('pt-BR')}</span>,
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-10',
      cellClassName: 'w-10',
      stopPropagation: true,
      render: row => row.role !== 'ADMIN' ? (
        <Button variant="icon" onClick={e => {
          e.stopPropagation();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuState(s => s?.id === row.id ? null : { id: row.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
        }}>
          <MoreHorizontal size={15} />
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Usuários"
        description="Contas de acesso ao sistema"
        action={
          <Button variant="primary" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={14} /> Novo usuário
          </Button>
        }
      />

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
          <Button variant="primary" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</Button>
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

          <Table
            columns={columns}
            data={rows}
            keyField="id"
            emptyMessage="Nenhum usuário encontrado."
            isLoading={isLoading}
          />
          <Pagination page={page} totalPages={totalPages} total={filtered.length} limit={PAGE_SIZE} onChange={setPage} />
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
